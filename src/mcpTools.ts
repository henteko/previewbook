import type { MCPClient, ToolCallResult } from "./mcpClient.js";
import type { JSONValue } from "./jsonrpc.js";

/**
 * Typed wrappers around the Xcode MCP tools this project relies on:
 * `XcodeListWindows`, `XcodeGrep`, `XcodeRead`, and `RenderPreview`.
 *
 * The exact result shapes returned by the Xcode MCP server are not strongly
 * specified, so each wrapper parses defensively: it prefers structured content
 * and otherwise JSON-parses the text payload, then maps a few likely field
 * names. Parsing is centralized here so the rest of the pipeline can rely on
 * clean, typed values.
 */

export interface XcodeWindow {
  /** Identifier passed to RenderPreview as `tabIdentifier`. */
  tabIdentifier: string;
  /** Absolute path of the project/workspace, when available. */
  projectPath?: string;
  /** Window/tab title, when available. */
  title?: string;
}

export interface GrepMatch {
  /** File path the match was found in. */
  path: string;
  /** 1-based line number. */
  line: number;
  /** Matched line text. */
  text: string;
}

export interface RenderResult {
  /** Absolute path to the rendered PNG snapshot. */
  previewSnapshotPath: string;
}

export interface RenderPreviewArgs {
  tabIdentifier?: string;
  sourceFilePath: string;
  previewDefinitionIndexInFile: number;
  timeout?: number;
}

/** Extracts a JSON value from a tool result, tolerating text-encoded JSON. */
export function toolResultJSON(result: ToolCallResult): JSONValue {
  if (result.structured !== undefined) return result.structured;
  const text = result.text.trim();
  if (!text) return null;
  try {
    return JSON.parse(text) as JSONValue;
  } catch {
    return text;
  }
}

function asObject(value: JSONValue): Record<string, JSONValue> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, JSONValue>)
    : undefined;
}

function pickString(
  obj: Record<string, JSONValue>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function throwIfError(result: ToolCallResult, tool: string): void {
  if (result.isError) {
    throw new Error(`${tool} failed: ${result.text || "(no detail)"}`);
  }
}

/**
 * This MCP server returns results as a single human-readable `message` string
 * (mirrored in both `structuredContent.message` and the text content), rather
 * than structured data. e.g. XcodeListWindows yields:
 *
 *   "* tabIdentifier: windowtab1, workspacePath: /path/My App.xcodeproj\n"
 *
 * `toolMessage` extracts that string; `field` pulls a single `key: value` out of
 * one line, allowing the value to contain spaces by stopping at the next
 * `, key:` boundary or end of line.
 */
function toolMessage(result: ToolCallResult): string {
  const json = toolResultJSON(result);
  const obj = asObject(json);
  if (obj) {
    const value = pickString(obj, ["message", "data", "content", "contents", "text", "output"]);
    if (value !== undefined) return value;
  }
  if (typeof json === "string") {
    try {
      const inner = asObject(JSON.parse(json) as JSONValue);
      if (inner) {
        const value = pickString(inner, ["message", "data", "text", "output"]);
        if (value !== undefined) return value;
      }
    } catch {
      // not JSON; fall through
    }
    return json;
  }
  return result.text;
}

function field(line: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const re = new RegExp(`${key}:\\s*(.+?)(?=,\\s*[A-Za-z]\\w*:\\s|$)`);
    const m = line.match(re);
    if (m && m[1] !== undefined) {
      const value = m[1].trim();
      if (value.length > 0) return value;
    }
  }
  return undefined;
}

function messageLines(message: string): string[] {
  return message
    .split("\n")
    .map((l) => l.replace(/^\s*[*\-•]\s*/, "").trim())
    .filter((l) => l.length > 0);
}

/** Lists open Xcode windows/tabs. */
export async function xcodeListWindows(
  client: MCPClient,
): Promise<XcodeWindow[]> {
  const result = await client.callTool("XcodeListWindows");
  throwIfError(result, "XcodeListWindows");

  const windows: XcodeWindow[] = [];
  for (const line of messageLines(toolMessage(result))) {
    const tabIdentifier = field(line, ["tabIdentifier", "identifier", "id"]);
    if (!tabIdentifier) continue;
    const window: XcodeWindow = { tabIdentifier };
    const projectPath = field(line, [
      "workspacePath",
      "projectPath",
      "documentPath",
      "path",
    ]);
    if (projectPath) window.projectPath = projectPath;
    const title = field(line, ["title", "name", "tabName"]);
    if (title) window.title = title;
    windows.push(window);
  }
  return windows;
}

/** Searches project source via the Xcode MCP grep tool. */
export async function xcodeGrep(
  client: MCPClient,
  query: string,
  extraArgs: Record<string, JSONValue> = {},
): Promise<GrepMatch[]> {
  const result = await client.callTool("XcodeGrep", {
    pattern: query,
    ...extraArgs,
  });
  throwIfError(result, "XcodeGrep");

  const matches: GrepMatch[] = [];

  // Primary: structured `{ results: ["path/to/File.swift", ...] }`. The server
  // uses the sentinel "No matches found" for empty results.
  const obj = asObject(toolResultJSON(result));
  if (obj && Array.isArray(obj.results)) {
    for (const entry of obj.results) {
      if (typeof entry !== "string") continue;
      const path = entry.trim();
      if (!path || path === "No matches found") continue;
      matches.push({ path, line: 0, text: "" });
    }
    return matches;
  }

  // Fallback: human-readable message lines (record or path:line:text style).
  for (const line of messageLines(toolMessage(result))) {
    // Preferred: "key: value" record style (matches XcodeListWindows).
    const path = field(line, [
      "sourceFilePath",
      "filePath",
      "file",
      "path",
    ]);
    if (path) {
      const lineNo = Number.parseInt(
        field(line, ["lineNumber", "line", "row"]) ?? "0",
        10,
      );
      const text = field(line, ["text", "content", "match", "lineText"]) ?? "";
      matches.push({ path, line: Number.isFinite(lineNo) ? lineNo : 0, text });
      continue;
    }
    // Fallback: classic "path:line: text" grep output.
    const m = line.match(/^(.+?\.swift):(\d+):?\s*(.*)$/);
    if (m && m[1] && m[2]) {
      matches.push({ path: m[1].trim(), line: Number.parseInt(m[2], 10), text: (m[3] ?? "").trim() });
    }
  }
  return matches;
}

export interface XcodeReadOptions {
  /** 1-based line to start from (for files larger than `limit`). */
  offset?: number;
  /** Max lines to read. XcodeRead defaults to 600; pass more for long files. */
  limit?: number;
}

/**
 * Reads a file's contents through XcodeRead.
 *
 * Per the tool schema the path argument is `filePath` and is an
 * Xcode-project-organization path (e.g. `ProjectName/Sources/MyFile.swift`),
 * not a filesystem path. XcodeRead returns content in `cat -n` format, so the
 * per-line number prefixes are stripped here to recover the raw source.
 */
export async function xcodeRead(
  client: MCPClient,
  filePath: string,
  tabIdentifier?: string,
  options: XcodeReadOptions = {},
): Promise<string> {
  const args: Record<string, JSONValue> = { filePath };
  if (tabIdentifier) args.tabIdentifier = tabIdentifier;
  if (options.offset !== undefined) args.offset = options.offset;
  if (options.limit !== undefined) args.limit = options.limit;
  const result = await client.callTool("XcodeRead", args);
  throwIfError(result, "XcodeRead");
  return stripCatN(toolMessage(result));
}

/** Removes leading `cat -n` line-number prefixes (`   12\t...`) from content. */
export function stripCatN(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*\d+\t/, ""))
    .join("\n");
}

/** Renders a single preview definition and returns its PNG path. */
export async function renderPreview(
  client: MCPClient,
  args: RenderPreviewArgs,
): Promise<RenderResult> {
  const callArgs: Record<string, JSONValue> = {
    sourceFilePath: args.sourceFilePath,
    previewDefinitionIndexInFile: args.previewDefinitionIndexInFile,
  };
  if (args.tabIdentifier) callArgs.tabIdentifier = args.tabIdentifier;
  if (args.timeout !== undefined) callArgs.timeout = args.timeout;

  const result = await client.callTool("RenderPreview", callArgs);
  throwIfError(result, "RenderPreview");

  // Try structured fields first, then parse the message text.
  const obj = asObject(toolResultJSON(result));
  let path = obj
    ? pickString(obj, ["previewSnapshotPath", "snapshotPath", "path"])
    : undefined;
  if (!path) {
    const message = toolMessage(result);
    for (const line of messageLines(message)) {
      path = field(line, ["previewSnapshotPath", "snapshotPath", "path"]);
      if (path) break;
    }
    // Last resort: a lone .png path somewhere in the message.
    if (!path) {
      const m = message.match(/(\/[^\n]*?\.png)/);
      if (m && m[1]) path = m[1].trim();
    }
  }
  if (!path) {
    throw new Error(
      `RenderPreview returned no snapshot path for ${args.sourceFilePath}#${args.previewDefinitionIndexInFile}`,
    );
  }
  return { previewSnapshotPath: path };
}

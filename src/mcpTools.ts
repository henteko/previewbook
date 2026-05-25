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

function asArray(value: JSONValue): JSONValue[] | undefined {
  return Array.isArray(value) ? value : undefined;
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

function pickNumber(
  obj: Record<string, JSONValue>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number") return v;
  }
  return undefined;
}

function throwIfError(result: ToolCallResult, tool: string): void {
  if (result.isError) {
    throw new Error(`${tool} failed: ${result.text || "(no detail)"}`);
  }
}

/** Lists open Xcode windows/tabs. */
export async function xcodeListWindows(
  client: MCPClient,
): Promise<XcodeWindow[]> {
  const result = await client.callTool("XcodeListWindows");
  throwIfError(result, "XcodeListWindows");
  const json = toolResultJSON(result);

  // Accept either a bare array or `{ windows: [...] }`.
  let items: JSONValue[] | undefined = asArray(json);
  if (!items) {
    const obj = asObject(json);
    items = obj ? asArray(obj.windows ?? obj.tabs ?? null) : undefined;
  }
  if (!items) return [];

  const windows: XcodeWindow[] = [];
  for (const item of items) {
    const obj = asObject(item);
    if (!obj) continue;
    const tabIdentifier = pickString(obj, [
      "tabIdentifier",
      "identifier",
      "id",
    ]);
    if (!tabIdentifier) continue;
    const window: XcodeWindow = { tabIdentifier };
    const projectPath = pickString(obj, [
      "projectPath",
      "workspacePath",
      "path",
      "documentPath",
    ]);
    if (projectPath) window.projectPath = projectPath;
    const title = pickString(obj, ["title", "name", "tabName"]);
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
    query,
    ...extraArgs,
  });
  throwIfError(result, "XcodeGrep");
  const json = toolResultJSON(result);

  let items: JSONValue[] | undefined = asArray(json);
  if (!items) {
    const obj = asObject(json);
    items = obj
      ? asArray(obj.matches ?? obj.results ?? obj.hits ?? null)
      : undefined;
  }
  if (!items) return [];

  const matches: GrepMatch[] = [];
  for (const item of items) {
    const obj = asObject(item);
    if (!obj) continue;
    const path = pickString(obj, ["path", "file", "filePath", "sourceFilePath"]);
    if (!path) continue;
    const line = pickNumber(obj, ["line", "lineNumber", "row"]) ?? 0;
    const text = pickString(obj, ["text", "content", "match", "lineText"]) ?? "";
    matches.push({ path, line, text });
  }
  return matches;
}

/** Reads a source file's contents through the Xcode MCP read tool. */
export async function xcodeRead(
  client: MCPClient,
  sourceFilePath: string,
): Promise<string> {
  const result = await client.callTool("XcodeRead", { sourceFilePath });
  throwIfError(result, "XcodeRead");
  const json = toolResultJSON(result);
  if (typeof json === "string") return json;
  const obj = asObject(json);
  if (obj) {
    const contents = pickString(obj, ["contents", "content", "text", "body"]);
    if (contents !== undefined) return contents;
  }
  // Fall back to the raw text payload.
  return result.text;
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
  const json = toolResultJSON(result);
  const obj = asObject(json);
  const path = obj
    ? pickString(obj, ["previewSnapshotPath", "snapshotPath", "path"])
    : typeof json === "string"
      ? json
      : undefined;
  if (!path) {
    throw new Error(
      `RenderPreview returned no snapshot path for ${args.sourceFilePath}#${args.previewDefinitionIndexInFile}`,
    );
  }
  return { previewSnapshotPath: path };
}

import path from "node:path";

import type { MCPClient } from "./mcpClient.js";
import { xcodeListWindows } from "./mcpTools.js";
import type { XcodeWindow } from "./mcpTools.js";
import { log } from "./logging.js";

export interface ResolvedProject {
  tabIdentifier: string;
  projectPath?: string;
  /** Directory used to relativize discovered source paths. */
  projectRoot?: string;
}

export interface DiscoveryOptions {
  /** Optional project/workspace path or substring to disambiguate windows. */
  projectHint?: string;
}

/**
 * Resolves which Xcode window to drive: matches an open window by the optional
 * project hint, or uses the sole open window. Ambiguity is surfaced as an error
 * listing the candidates rather than guessing.
 */
export async function discoverProject(
  client: MCPClient,
  options: DiscoveryOptions = {},
): Promise<ResolvedProject> {
  const windows = await xcodeListWindows(client);
  if (windows.length === 0) {
    throw new Error(
      "No open Xcode windows found. Open your project in Xcode and try again.",
    );
  }

  const chosen = selectWindow(windows, options.projectHint);
  const resolved: ResolvedProject = { tabIdentifier: chosen.tabIdentifier };
  if (chosen.projectPath) {
    resolved.projectPath = chosen.projectPath;
    resolved.projectRoot = projectRootFor(chosen.projectPath);
  }
  log.info(
    `using window "${chosen.title ?? chosen.tabIdentifier}"` +
      (chosen.projectPath ? ` (${chosen.projectPath})` : ""),
  );
  return resolved;
}

function selectWindow(
  windows: XcodeWindow[],
  hint?: string,
): XcodeWindow {
  if (hint) {
    const needle = hint.toLowerCase();
    const matches = windows.filter(
      (w) =>
        w.projectPath?.toLowerCase().includes(needle) ||
        w.title?.toLowerCase().includes(needle),
    );
    if (matches.length === 1) return matches[0]!;
    if (matches.length === 0) {
      throw new Error(
        `No open Xcode window matches "${hint}". ${describe(windows)}`,
      );
    }
    throw new Error(
      `"${hint}" matches multiple Xcode windows. ${describe(matches)}`,
    );
  }

  if (windows.length === 1) return windows[0]!;
  throw new Error(
    `Multiple Xcode windows are open; pass --project to choose one. ${describe(windows)}`,
  );
}

function describe(windows: XcodeWindow[]): string {
  const lines = windows.map(
    (w) => `  - ${w.title ?? "(untitled)"} [${w.projectPath ?? w.tabIdentifier}]`,
  );
  return `Candidates:\n${lines.join("\n")}`;
}

/** `.xcodeproj`/`.xcworkspace` bundles sit inside the project root directory. */
function projectRootFor(projectPath: string): string {
  const ext = path.extname(projectPath);
  if (ext === ".xcodeproj" || ext === ".xcworkspace") {
    return path.dirname(projectPath);
  }
  // A directory or a loose file: use its directory.
  return path.extname(projectPath) ? path.dirname(projectPath) : projectPath;
}

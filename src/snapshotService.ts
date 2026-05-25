import type { MCPClient } from "./mcpClient.js";
import { renderPreview, xcodeGrep, xcodeRead } from "./mcpTools.js";
import { parsePreviewDefinitions } from "./previewMetadata.js";
import type { CapturedPreview } from "./catalog.js";
import type { ResolvedProject } from "./projectDiscovery.js";
import { log } from "./logging.js";

export interface SnapshotOptions {
  /** Per-render timeout passed to RenderPreview, in seconds. */
  renderTimeout?: number;
}

// XcodeRead defaults to 600 lines; request more so previews near the bottom of
// long files are not missed.
const READ_LINE_LIMIT = 10_000;

/**
 * Discovers preview-bearing source files, parses their preview definitions, and
 * renders each one sequentially (the design accepts that rendering is serial).
 *
 * Paths are Xcode-project-organization paths (what XcodeGrep returns and what
 * XcodeRead/RenderPreview expect) — not filesystem paths. XcodeGrep can list the
 * same file under more than one project root; those are collapsed by
 * {@link dedupePaths} since one variant is a path-suffix of the other.
 */
export async function captureSnapshots(
  client: MCPClient,
  project: ResolvedProject,
  options: SnapshotOptions = {},
): Promise<CapturedPreview[]> {
  const rawPaths = await discoverPreviewFiles(client, project.tabIdentifier);
  if (rawPaths.length === 0) {
    log.warn("No #Preview or PreviewProvider definitions found.");
    return [];
  }

  const files = dedupePaths(rawPaths);
  log.info(`found ${files.length} file(s) containing previews`);

  const captures: CapturedPreview[] = [];
  for (const file of files) {
    let source: string;
    try {
      source = await xcodeRead(client, file, project.tabIdentifier, {
        limit: READ_LINE_LIMIT,
      });
    } catch (err) {
      log.warn(`could not read ${file}: ${(err as Error).message}`);
      continue;
    }

    const definitions = parsePreviewDefinitions(source);
    if (definitions.length === 0) continue;
    log.info(`${file}: ${definitions.length} preview(s)`);

    for (const definition of definitions) {
      try {
        const render = await renderPreview(client, {
          tabIdentifier: project.tabIdentifier,
          sourceFilePath: file,
          previewDefinitionIndexInFile: definition.index,
          timeout: options.renderTimeout,
        });
        captures.push({
          sourceFile: file,
          snapshotPath: render.previewSnapshotPath,
          definition,
        });
        log.debug(
          `rendered ${file}#${definition.index} -> ${render.previewSnapshotPath}`,
        );
      } catch (err) {
        log.warn(
          `skipping ${file}#${definition.index}: ${(err as Error).message}`,
        );
      }
    }
  }

  log.info(`captured ${captures.length} snapshot(s)`);
  return captures;
}

/** Unions grep hits for `#Preview` and `PreviewProvider` into a path list. */
async function discoverPreviewFiles(
  client: MCPClient,
  tabIdentifier: string,
): Promise<string[]> {
  const queries = ["#Preview", "PreviewProvider"];
  const seen = new Set<string>();
  for (const query of queries) {
    const matches = await xcodeGrep(client, query, { tabIdentifier });
    for (const match of matches) {
      if (match.path.endsWith(".swift")) seen.add(match.path);
    }
  }
  return [...seen];
}

/**
 * Collapses paths that refer to the same file under different project roots.
 * XcodeGrep may return e.g. `App/Views/X.swift` and
 * `Pkg/Sources/App/Views/X.swift`; the first is a path-component suffix of the
 * second, so we keep the shortest representative of each suffix group.
 */
export function dedupePaths(paths: string[]): string[] {
  const items = [...new Set(paths)]
    .map((p) => ({ p, parts: p.split("/").filter(Boolean) }))
    .sort((a, b) => a.parts.length - b.parts.length || a.p.localeCompare(b.p));

  const kept: Array<{ p: string; parts: string[] }> = [];
  for (const item of items) {
    if (!kept.some((k) => isSuffix(k.parts, item.parts))) kept.push(item);
  }
  return kept.map((k) => k.p);
}

/** True if `short` equals the trailing components of `long`. */
function isSuffix(short: string[], long: string[]): boolean {
  if (short.length === 0 || short.length > long.length) return false;
  for (let i = 1; i <= short.length; i++) {
    if (short[short.length - i] !== long[long.length - i]) return false;
  }
  return true;
}

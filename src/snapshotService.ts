import path from "node:path";

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

/**
 * Discovers preview-bearing source files, parses their preview definitions, and
 * renders each one sequentially (the design accepts that rendering is serial).
 *
 * Returns a flat list of captured previews ready to be folded into a catalog.
 */
export async function captureSnapshots(
  client: MCPClient,
  project: ResolvedProject,
  options: SnapshotOptions = {},
): Promise<CapturedPreview[]> {
  const files = await discoverPreviewFiles(client);
  if (files.length === 0) {
    log.warn("No #Preview or PreviewProvider definitions found.");
    return [];
  }
  log.info(`found ${files.length} file(s) containing previews`);

  const captures: CapturedPreview[] = [];
  for (const absoluteFile of files) {
    const source = await xcodeRead(client, absoluteFile);
    const definitions = parsePreviewDefinitions(source);
    if (definitions.length === 0) continue;

    const relativeFile = relativize(absoluteFile, project.projectRoot);
    log.info(`${relativeFile}: ${definitions.length} preview(s)`);

    for (const definition of definitions) {
      try {
        const render = await renderPreview(client, {
          tabIdentifier: project.tabIdentifier,
          sourceFilePath: absoluteFile,
          previewDefinitionIndexInFile: definition.index,
          timeout: options.renderTimeout,
        });
        captures.push({
          sourceFile: relativeFile,
          snapshotPath: render.previewSnapshotPath,
          definition,
        });
        log.debug(
          `rendered ${relativeFile}#${definition.index} -> ${render.previewSnapshotPath}`,
        );
      } catch (err) {
        log.warn(
          `skipping ${relativeFile}#${definition.index}: ${(err as Error).message}`,
        );
      }
    }
  }

  log.info(`captured ${captures.length} snapshot(s)`);
  return captures;
}

/** Unions grep hits for `#Preview` and `PreviewProvider` into a file list. */
async function discoverPreviewFiles(client: MCPClient): Promise<string[]> {
  const queries = ["#Preview", "PreviewProvider"];
  const seen = new Set<string>();
  for (const query of queries) {
    const matches = await xcodeGrep(client, query);
    for (const match of matches) {
      if (match.path.endsWith(".swift")) seen.add(match.path);
    }
  }
  return [...seen].sort();
}

function relativize(absoluteFile: string, root?: string): string {
  if (!root) return absoluteFile;
  const rel = path.relative(root, absoluteFile);
  // Keep within-project paths; fall back to absolute for outside files.
  return rel.startsWith("..") ? absoluteFile : rel.replaceAll(path.sep, "/");
}

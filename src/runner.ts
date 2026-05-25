import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { MCPClient } from "./mcpClient.js";
import { discoverProject } from "./projectDiscovery.js";
import { captureSnapshots } from "./snapshotService.js";
import { buildCatalog } from "./catalog.js";
import type { BuildResult } from "./catalog.js";
import { emitManifest } from "./manifestEmitter.js";
import { generateSite } from "./site/siteGenerator.js";
import { serveDirectory } from "./previewServer.js";
import type { RunningServer } from "./previewServer.js";
import { log } from "./logging.js";

export interface RunnerOptions {
  /** Project/workspace hint to disambiguate open Xcode windows. */
  projectHint?: string;
  /** Override the site title (defaults to "<Project> Preview Book"). */
  title?: string;
  /** Per-render timeout in seconds passed through to RenderPreview. */
  renderTimeout?: number;
  /** Override the MCP bridge launch command (defaults to `xcrun`). */
  bridgeCommand?: string;
  /** Override the MCP bridge arguments (defaults to `["mcpbridge"]`). */
  bridgeArgs?: string[];
}

export interface ServeOptions extends RunnerOptions {
  port?: number;
  openBrowser?: boolean;
}

/** Runs the full pipeline and returns the in-memory catalog + asset plan. */
async function produceCatalog(options: RunnerOptions): Promise<BuildResult> {
  const client = new MCPClient({
    command: options.bridgeCommand,
    args: options.bridgeArgs,
  });
  try {
    await client.connect();
    const project = await discoverProject(client, {
      projectHint: options.projectHint,
    });
    const captures = await captureSnapshots(client, project, {
      renderTimeout: options.renderTimeout,
    });
    const title = options.title ?? defaultTitle(project.projectPath);
    return buildCatalog(captures, { title });
  } finally {
    client.close();
  }
}

/** `build` command: write the static site to `outputDir`. */
export async function runBuild(
  outputDir: string,
  options: RunnerOptions,
): Promise<void> {
  const { manifest, assets } = await produceCatalog(options);
  await emitManifest(outputDir, manifest, assets);
  // Embed the manifest so the output works from file:// without fetch.
  await generateSite(outputDir, {
    title: manifest.title,
    embedManifest: manifest,
  });
  log.info(`built ${manifest.title} -> ${path.resolve(outputDir)}`);
}

/** Default command: snapshot, then serve over localhost HTTP. */
export async function runServe(options: ServeOptions): Promise<RunningServer> {
  const { manifest, assets } = await produceCatalog(options);

  const siteDir = await mkdtemp(path.join(tmpdir(), "previewbook-"));
  await emitManifest(siteDir, manifest, assets);
  // Serve mode: SPA fetches stories.json, so do not embed.
  await generateSite(siteDir, { title: manifest.title });

  const server = await serveDirectory(siteDir, { port: options.port });
  log.info(`serving ${manifest.title} at ${server.url}`);

  if (options.openBrowser !== false) {
    openInBrowser(server.url);
  }
  return server;
}

function defaultTitle(projectPath?: string): string {
  if (!projectPath) return "Preview Book";
  const base = path.basename(projectPath).replace(/\.[^.]+$/, "");
  return base ? `${base} Preview Book` : "Preview Book";
}

function openInBrowser(url: string): void {
  const platform = process.platform;
  const command =
    platform === "darwin"
      ? "open"
      : platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.on("error", () => {
      log.warn(`could not open browser; visit ${url}`);
    });
    child.unref();
  } catch {
    log.warn(`could not open browser; visit ${url}`);
  }
}

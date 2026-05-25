import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Manifest } from "../catalog.js";
import { APP_JS, PLACEHOLDER_CSS } from "./templates.js";
import { log } from "../logging.js";

export interface SiteOptions {
  /**
   * When provided, the manifest is embedded directly into index.html as
   * `window.__PREVIEWBOOK_MANIFEST__`. Use this for `build` output so the site
   * works from `file://` without `fetch`. When omitted, the SPA fetches
   * `stories.json` at runtime (serve mode).
   */
  embedManifest?: Manifest;
  /** Title used in the <title>/header before the manifest loads. */
  title: string;
}

/** Writes `index.html` (CSS + JS inlined) into the output directory. */
export async function generateSite(
  outputDir: string,
  options: SiteOptions,
): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const html = renderIndexHtml(options);
  const dest = path.join(outputDir, "index.html");
  await writeFile(dest, html, "utf8");
  log.debug(`wrote ${dest}`);
}

export function renderIndexHtml(options: SiteOptions): string {
  const embed = options.embedManifest
    ? `<script>window.__PREVIEWBOOK_MANIFEST__ = ${safeJson(
        options.embedManifest,
      )};</script>\n`
    : "";

  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(options.title)}</title>
<!-- PLACEHOLDER DESIGN: styling lives entirely in this <style> block. -->
<style>${PLACEHOLDER_CSS}</style>
</head>
<body>
<header>
  <span class="brand" id="title">${escapeHtml(options.title)}</span>
  <span class="badge" title="Temporary UI; final design pending">placeholder</span>
  <span class="spacer"></span>
  <input class="search" id="search" type="search" placeholder="Filter previews…" autocomplete="off">
  <button id="theme" title="Toggle light/dark">◑ Theme</button>
</header>
<main>
  <aside class="sidebar" id="tree"></aside>
  <section class="canvas" id="canvas">
    <div class="empty">Loading…</div>
  </section>
  <aside class="details" id="details">
    <p class="sub">Select a preview to inspect.</p>
  </aside>
</main>
<footer><span id="generated"></span></footer>
<div class="lightbox" id="lightbox"><img id="lightbox-img" alt=""></div>
${embed}<script>${APP_JS}</script>
</body>
</html>
`;
}

/** JSON safe to embed in an inline <script> (neutralizes `</script>`). */
function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

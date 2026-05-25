import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Manifest } from "../catalog.js";
import { siteAppJs, siteStyles } from "./templates.js";
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
<style>${siteStyles()}</style>
</head>
<body>
<div id="root"></div>
${embed}<script>${siteAppJs()}</script>
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

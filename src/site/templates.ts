import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Loads the site's CSS and JS assets.
 *
 * The actual design lives as plain `styles.css` / `app.js` files under
 * `assets/` (alongside this module) so a designer can edit them directly. They
 * are read here and inlined into `index.html` by the {@link generateSite}
 * generator, keeping the produced site free of external dependencies and usable
 * from `file://`.
 *
 * Assets resolve relative to this module's location, so they work both when run
 * from source via `tsx` (src/site/assets) and from the compiled output
 * (dist/site/assets — copied during build).
 */

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");

let cssCache: string | undefined;
let jsCache: string | undefined;

export function siteStyles(): string {
  if (cssCache === undefined) {
    cssCache = readFileSync(path.join(assetsDir, "styles.css"), "utf8");
  }
  return cssCache;
}

export function siteAppJs(): string {
  if (jsCache === undefined) {
    jsCache = readFileSync(path.join(assetsDir, "app.js"), "utf8");
  }
  return jsCache;
}

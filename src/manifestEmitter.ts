import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

import type { AssetCopy, Manifest } from "./catalog.js";
import { log } from "./logging.js";

/**
 * Writes `stories.json` and copies snapshot PNGs into `assets/` under the
 * output directory. Asset destination paths in {@link AssetCopy.to} are
 * site-relative (e.g. `assets/Foo_0.png`).
 */
export async function emitManifest(
  outputDir: string,
  manifest: Manifest,
  assets: AssetCopy[],
): Promise<void> {
  await mkdir(path.join(outputDir, "assets"), { recursive: true });

  const manifestPath = path.join(outputDir, "stories.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  log.debug(`wrote ${manifestPath}`);

  let copied = 0;
  for (const asset of assets) {
    const dest = path.join(outputDir, asset.to);
    await mkdir(path.dirname(dest), { recursive: true });
    try {
      await copyFile(asset.from, dest);
      copied++;
    } catch (err) {
      log.warn(
        `failed to copy snapshot ${asset.from} -> ${asset.to}: ${
          (err as Error).message
        }`,
      );
    }
  }
  log.debug(`copied ${copied}/${assets.length} snapshots into assets/`);
}

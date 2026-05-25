/**
 * Generates a sample Preview Book site with placeholder snapshots so the
 * (temporary) UI can be reviewed in a browser without a live Xcode/MCP session.
 *
 *   npm run demo   # -> examples/demo-site/index.html
 *
 * Snapshots are simple solid-colour PNGs standing in for rendered previews.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

import { generateSite } from "../src/site/siteGenerator.js";
import type { Manifest } from "../src/catalog.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "examples", "demo-site");

/** Encodes a solid-colour RGB PNG. */
function solidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  // 10..12 already 0 (compression/filter/interlace)

  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const p = rowStart + 1 + x * 3;
      raw[p] = rgb[0];
      raw[p + 1] = rgb[1];
      raw[p + 2] = rgb[2];
    }
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

async function writeSnapshot(
  rel: string,
  rgb: [number, number, number],
  size: [number, number] = [240, 480],
): Promise<void> {
  const dest = path.join(outDir, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, solidPng(size[0], size[1], rgb));
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });

  const snaps: Array<[string, [number, number, number]]> = [
    ["assets/contentview_0.png", [245, 246, 248]],
    ["assets/contentview_1.png", [21, 23, 26]],
    ["assets/settingsview_0.png", [235, 240, 250]],
    ["assets/primarybutton_0.png", [59, 111, 224]],
    ["assets/primarybutton_1.png", [120, 120, 128]],
  ];
  for (const [rel, rgb] of snaps) await writeSnapshot(rel, rgb);

  const manifest: Manifest = {
    title: "Demo Preview Book",
    generatedAt: new Date().toISOString(),
    tree: [
      {
        type: "group",
        name: "Views",
        children: [
          {
            type: "component",
            name: "ContentView",
            sourceFile: "Demo/Views/ContentView.swift",
            stories: [
              {
                id: "contentview-default",
                name: "Default",
                asset: "assets/contentview_0.png",
                source: '#Preview("Default") {\n    ContentView()\n}',
                file: "Demo/Views/ContentView.swift",
                index: 0,
                targetType: "ContentView",
                kind: "macro",
                line: 42,
                endLine: 44,
              },
              {
                id: "contentview-dark",
                name: "Dark",
                asset: "assets/contentview_1.png",
                source:
                  '#Preview("Dark") {\n    ContentView()\n        .preferredColorScheme(.dark)\n}',
                file: "Demo/Views/ContentView.swift",
                index: 1,
                targetType: "ContentView",
                kind: "macro",
                line: 46,
                endLine: 49,
              },
            ],
          },
          {
            type: "component",
            name: "SettingsView",
            sourceFile: "Demo/Views/Settings/SettingsView.swift",
            stories: [
              {
                id: "settingsview-default",
                name: "Default",
                asset: "assets/settingsview_0.png",
                source: "#Preview {\n    SettingsView()\n}",
                file: "Demo/Views/Settings/SettingsView.swift",
                index: 0,
                targetType: "SettingsView",
                kind: "macro",
                line: 31,
                endLine: 33,
              },
            ],
          },
        ],
      },
      {
        type: "group",
        name: "Components",
        children: [
          {
            type: "component",
            name: "PrimaryButton",
            sourceFile: "Demo/Components/PrimaryButton.swift",
            stories: [
              {
                id: "primarybutton-enabled",
                name: "Enabled",
                asset: "assets/primarybutton_0.png",
                source: '#Preview("Enabled") {\n    PrimaryButton(title: "Save") {}\n}',
                file: "Demo/Components/PrimaryButton.swift",
                index: 0,
                targetType: "PrimaryButton",
                kind: "macro",
                line: 58,
                endLine: 60,
              },
              {
                id: "primarybutton-disabled",
                name: "Disabled",
                asset: "assets/primarybutton_1.png",
                source:
                  '#Preview("Disabled") {\n    PrimaryButton(title: "Save") {}\n        .disabled(true)\n}',
                file: "Demo/Components/PrimaryButton.swift",
                index: 1,
                targetType: "PrimaryButton",
                kind: "macro",
                line: 62,
                endLine: 65,
              },
            ],
          },
        ],
      },
    ],
  };

  // Embed the manifest so the demo opens directly via file:// as well.
  await writeFile(
    path.join(outDir, "stories.json"),
    JSON.stringify(manifest, null, 2),
  );
  await generateSite(outDir, { title: manifest.title, embedManifest: manifest });

  process.stdout.write(`Demo site written to ${outDir}\nOpen ${path.join(outDir, "index.html")}\n`);
}

main().catch((err) => {
  process.stderr.write(`${(err as Error).stack ?? err}\n`);
  process.exit(1);
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildCatalog } from "../src/catalog.js";
import type { CapturedPreview } from "../src/catalog.js";
import { emitManifest } from "../src/manifestEmitter.js";
import { generateSite } from "../src/site/siteGenerator.js";
import { serveDirectory } from "../src/previewServer.js";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "previewbook-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("emit + generate writes a serveable static site", async () => {
  await withTempDir(async (work) => {
    const snapshot = path.join(work, "snap.png");
    await writeFile(snapshot, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const captures: CapturedPreview[] = [
      {
        sourceFile: "App/ContentView.swift",
        snapshotPath: snapshot,
        definition: {
          index: 0,
          kind: "macro",
          label: "Default",
          targetType: "ContentView",
          source: "#Preview { ContentView() }",
          startLine: 1,
          endLine: 1,
        },
      },
    ];

    const { manifest, assets } = buildCatalog(captures, { title: "Book" });

    const out = path.join(work, "out");
    await emitManifest(out, manifest, assets);
    await generateSite(out, { title: manifest.title });

    const storiesRaw = await readFile(path.join(out, "stories.json"), "utf8");
    const stories = JSON.parse(storiesRaw);
    assert.equal(stories.title, "Book");
    assert.equal(stories.tree[0].name, "ContentView");

    // The snapshot was copied to its site-relative asset path.
    const copied = await readFile(
      path.join(out, "assets", "contentview_0.png"),
    );
    assert.equal(copied.length, 4);

    const html = await readFile(path.join(out, "index.html"), "utf8");
    assert.ok(html.includes("<title>Book</title>"));
  });
});

test("server serves files and falls back to index.html", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "index.html"), "<h1>home</h1>");
    await writeFile(path.join(dir, "stories.json"), '{"ok":true}');

    const server = await serveDirectory(dir);
    try {
      const index = await fetch(server.url);
      assert.equal(index.status, 200);
      assert.match(index.headers.get("content-type") ?? "", /text\/html/);
      assert.equal(await index.text(), "<h1>home</h1>");

      const json = await fetch(server.url + "stories.json");
      assert.equal(json.status, 200);
      assert.match(json.headers.get("content-type") ?? "", /application\/json/);

      // Unknown client-routed path falls back to index.html.
      const deep = await fetch(server.url + "Views/ContentView/Dark");
      assert.equal(deep.status, 200);
      assert.equal(await deep.text(), "<h1>home</h1>");
    } finally {
      await server.close();
    }
  });
});

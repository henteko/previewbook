import test from "node:test";
import assert from "node:assert/strict";

import { renderIndexHtml } from "../src/site/siteGenerator.js";
import type { Manifest } from "../src/catalog.js";

const manifest: Manifest = {
  title: "Demo",
  generatedAt: "2026-05-25T00:00:00Z",
  tree: [
    {
      type: "component",
      name: "ContentView",
      sourceFile: "ContentView.swift",
      stories: [
        {
          id: "contentview-default",
          name: "Default",
          asset: "assets/contentview_0.png",
          source: "#Preview { ContentView() }",
          file: "ContentView.swift",
          index: 0,
        },
      ],
    },
  ],
};

test("escapes the title in HTML", () => {
  const html = renderIndexHtml({ title: `A<b>&"c` });
  assert.match(html, /<title>A&lt;b&gt;&amp;&quot;c<\/title>/);
  assert.ok(!html.includes("<title>A<b>"));
});

test("serve mode does not embed the manifest", () => {
  const html = renderIndexHtml({ title: "Demo" });
  // app.js still *reads* the global; serve mode just never *assigns* it.
  assert.ok(!html.includes("window.__PREVIEWBOOK_MANIFEST__ ="));
});

test("build mode embeds the manifest safely", () => {
  const html = renderIndexHtml({ title: "Demo", embedManifest: manifest });
  assert.ok(html.includes("window.__PREVIEWBOOK_MANIFEST__ ="));
  assert.ok(html.includes("contentview-default"));
});

test("embedded manifest neutralizes </script>", () => {
  const evil: Manifest = { ...manifest, title: "pwn</script><script>alert(1)" };
  const html = renderIndexHtml({ title: "Demo", embedManifest: evil });
  // The injected closing tag must be escaped inside the data script.
  assert.ok(html.includes("\\u003c/script>"));
  assert.ok(!html.includes("</script><script>alert(1)"));
});

test("includes inlined CSS and JS (zero external deps)", () => {
  const html = renderIndexHtml({ title: "Demo" });
  assert.ok(html.includes("<style>"));
  assert.ok(html.includes("__PREVIEWBOOK"));
  // No external resources: no remote URLs, no external <script src>.
  assert.ok(!/<script[^>]+\bsrc=/.test(html));
  assert.ok(!html.includes("https://"));
  // Any <link> must be an inline data: URI (e.g. the favicon), not external.
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    assert.ok(m[0].includes('href="data:'), `external link found: ${m[0]}`);
  }
});

test("embeds a data-URI favicon", () => {
  const html = renderIndexHtml({ title: "Demo" });
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml;base64,/);
});

test("renders the #root mount and inlines the SPA", () => {
  const html = renderIndexHtml({ title: "Demo" });
  assert.ok(html.includes('<div id="root"></div>'));
  assert.ok(html.includes("Search components, stories"));
});

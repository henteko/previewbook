import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCatalog,
  commonDirectoryPrefix,
  slug,
} from "../src/catalog.js";
import type { CapturedPreview, ComponentNode, GroupNode } from "../src/catalog.js";
import type { PreviewDefinition } from "../src/previewMetadata.js";

function def(
  index: number,
  partial: Partial<PreviewDefinition> = {},
): PreviewDefinition {
  return {
    index,
    kind: "macro",
    source: `#Preview { View${index}() }`,
    startLine: 1,
    endLine: 1,
    ...partial,
  };
}

function capture(
  sourceFile: string,
  definition: PreviewDefinition,
): CapturedPreview {
  return { sourceFile, snapshotPath: `/tmp/${definition.index}.png`, definition };
}

test("slug normalizes labels", () => {
  assert.equal(slug("Dark Mode!"), "dark-mode");
  assert.equal(slug("  "), "item");
});

test("commonDirectoryPrefix finds shared directory", () => {
  assert.equal(
    commonDirectoryPrefix(["App/Views/A.swift", "App/Views/Sub/B.swift"]),
    "App/Views/",
  );
  assert.equal(commonDirectoryPrefix(["App/Views/A.swift"]), "App/Views/");
});

test("builds a tree, strips common prefix, and assigns assets", () => {
  const captures: CapturedPreview[] = [
    capture("MyApp/Views/ContentView.swift", def(0, { label: "Default", targetType: "ContentView" })),
    capture("MyApp/Views/ContentView.swift", def(1, { label: "Dark", targetType: "ContentView" })),
    capture("MyApp/Views/Settings/SettingsView.swift", def(0, { label: "Default" })),
  ];

  const { manifest, assets } = buildCatalog(captures, {
    title: "Test Book",
    generatedAt: "2026-05-25T00:00:00Z",
  });

  assert.equal(manifest.title, "Test Book");
  assert.equal(manifest.generatedAt, "2026-05-25T00:00:00Z");

  // Top level: ContentView (component) + Settings (group).
  assert.equal(manifest.tree.length, 2);
  const content = manifest.tree[0] as ComponentNode;
  assert.equal(content.type, "component");
  assert.equal(content.name, "ContentView");
  assert.equal(content.stories.length, 2);
  assert.deepEqual(
    content.stories.map((s) => s.name),
    ["Default", "Dark"],
  );
  assert.deepEqual(
    content.stories.map((s) => s.id),
    ["contentview-default", "contentview-dark"],
  );
  assert.equal(content.stories[0]!.asset, "assets/contentview_0.png");
  assert.equal(content.stories[1]!.asset, "assets/contentview_1.png");
  assert.equal(content.stories[0]!.targetType, "ContentView");

  const settings = manifest.tree[1] as GroupNode;
  assert.equal(settings.type, "group");
  assert.equal(settings.name, "Settings");
  const settingsComponent = settings.children[0] as ComponentNode;
  assert.equal(settingsComponent.name, "SettingsView");

  // Asset copy plan maps source snapshots to site-relative destinations.
  assert.deepEqual(assets, [
    { from: "/tmp/0.png", to: "assets/contentview_0.png" },
    { from: "/tmp/1.png", to: "assets/contentview_1.png" },
    { from: "/tmp/0.png", to: "assets/settingsview_0.png" },
  ]);
});

test("disambiguates duplicate story ids within a component", () => {
  const captures: CapturedPreview[] = [
    capture("A.swift", def(0, { label: "Same" })),
    capture("A.swift", def(1, { label: "Same" })),
  ];
  const { manifest } = buildCatalog(captures, { title: "T" });
  const component = manifest.tree[0] as ComponentNode;
  assert.deepEqual(
    component.stories.map((s) => s.id),
    ["a-same", "a-same-1"],
  );
});

test("names unlabeled macros by position", () => {
  const { manifest } = buildCatalog([capture("A.swift", def(0))], { title: "T" });
  const component = manifest.tree[0] as ComponentNode;
  assert.equal(component.stories[0]!.name, "Preview 1");
});

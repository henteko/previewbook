import test from "node:test";
import assert from "node:assert/strict";

import { dedupePaths } from "../src/snapshotService.js";

test("dedupePaths collapses the same file listed under multiple roots", () => {
  const out = dedupePaths([
    "Maycast Studio/Maycast Studio/ContentView.swift",
    "MaycastStudio/Apps/MaycastStudio/Maycast Studio/Maycast Studio/ContentView.swift",
    "Maycast Studio/Maycast Studio/HomeView.swift",
  ]);
  assert.deepEqual(out.sort(), [
    "Maycast Studio/Maycast Studio/ContentView.swift",
    "Maycast Studio/Maycast Studio/HomeView.swift",
  ]);
});

test("dedupePaths keeps distinct files that share a basename", () => {
  const out = dedupePaths(["A/View.swift", "B/View.swift"]);
  assert.equal(out.length, 2);
});

test("dedupePaths removes exact duplicates", () => {
  const out = dedupePaths(["X/Y.swift", "X/Y.swift"]);
  assert.deepEqual(out, ["X/Y.swift"]);
});

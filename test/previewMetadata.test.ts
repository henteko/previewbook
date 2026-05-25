import test from "node:test";
import assert from "node:assert/strict";

import { parsePreviewDefinitions } from "../src/previewMetadata.js";

test("parses a bare #Preview macro with target type", () => {
  const defs = parsePreviewDefinitions(`#Preview { ContentView() }`);
  assert.equal(defs.length, 1);
  assert.equal(defs[0]!.kind, "macro");
  assert.equal(defs[0]!.index, 0);
  assert.equal(defs[0]!.label, undefined);
  assert.equal(defs[0]!.targetType, "ContentView");
});

test("extracts an explicit label", () => {
  const defs = parsePreviewDefinitions(
    `#Preview("Dark") { ContentView().preferredColorScheme(.dark) }`,
  );
  assert.equal(defs.length, 1);
  assert.equal(defs[0]!.label, "Dark");
  assert.equal(defs[0]!.targetType, "ContentView");
});

test("braces and parens inside the label string do not break matching", () => {
  const defs = parsePreviewDefinitions(`#Preview("has } and ) inside") { Foo() }`);
  assert.equal(defs.length, 1);
  assert.equal(defs[0]!.label, "has } and ) inside");
  assert.equal(defs[0]!.targetType, "Foo");
});

test("ignores #Preview inside comments and strings", () => {
  const source = [
    `// #Preview { Commented() }`,
    `let s = "#Preview { InString() }"`,
    `#Preview { Real() }`,
  ].join("\n");
  const defs = parsePreviewDefinitions(source);
  assert.equal(defs.length, 1);
  assert.equal(defs[0]!.targetType, "Real");
});

test("parses PreviewProvider and derives the component name", () => {
  const source = [
    `struct ContentView_Previews: PreviewProvider {`,
    `  static var previews: some View {`,
    `    ContentView()`,
    `  }`,
    `}`,
  ].join("\n");
  const defs = parsePreviewDefinitions(source);
  assert.equal(defs.length, 1);
  assert.equal(defs[0]!.kind, "provider");
  assert.equal(defs[0]!.label, "ContentView");
  assert.equal(defs[0]!.targetType, "ContentView");
});

test("orders mixed definitions by source position", () => {
  const source = [
    `struct A_Previews: PreviewProvider {`,
    `  static var previews: some View { A() }`,
    `}`,
    ``,
    `#Preview("First macro") { B() }`,
    `#Preview { C() }`,
  ].join("\n");
  const defs = parsePreviewDefinitions(source);
  assert.equal(defs.length, 3);
  assert.deepEqual(
    defs.map((d) => d.index),
    [0, 1, 2],
  );
  assert.equal(defs[0]!.kind, "provider");
  assert.equal(defs[1]!.label, "First macro");
  assert.equal(defs[2]!.targetType, "C");
});

test("computes 1-based line ranges", () => {
  const source = ["import SwiftUI", "", "#Preview {", "  Foo()", "}"].join("\n");
  const defs = parsePreviewDefinitions(source);
  assert.equal(defs[0]!.startLine, 3);
  assert.equal(defs[0]!.endLine, 5);
});

test("captures the exact source snippet", () => {
  const macro = `#Preview("X") { Foo() }`;
  const defs = parsePreviewDefinitions(`import SwiftUI\n${macro}\n`);
  assert.equal(defs[0]!.source, macro);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  xcodeListWindows,
  xcodeGrep,
  xcodeRead,
  renderPreview,
  stripCatN,
} from "../src/mcpTools.js";
import type { MCPClient, ToolCallResult } from "../src/mcpClient.js";

/** A stub MCPClient whose callTool returns a canned message-string result. */
function stubClient(message: string): MCPClient {
  const result: ToolCallResult = {
    text: JSON.stringify({ message }),
    structured: { message },
    isError: false,
    raw: { structuredContent: { message } },
  };
  return { callTool: async () => result } as unknown as MCPClient;
}

/** A stub MCPClient returning a structured (JSON object) result. */
function stubStructured(structured: Record<string, unknown>): MCPClient {
  const result: ToolCallResult = {
    text: JSON.stringify(structured),
    structured: structured as never,
    isError: false,
    raw: { structuredContent: structured as never },
  };
  return { callTool: async () => result } as unknown as MCPClient;
}

test("XcodeListWindows: parses the real message format (paths with spaces)", async () => {
  const message =
    "* tabIdentifier: windowtab1, workspacePath: /Users/henteko/dev/maycast-studio/Apps/MaycastStudio/Maycast Studio/Maycast Studio.xcodeproj\n";
  const windows = await xcodeListWindows(stubClient(message));
  assert.equal(windows.length, 1);
  assert.equal(windows[0]!.tabIdentifier, "windowtab1");
  assert.equal(
    windows[0]!.projectPath,
    "/Users/henteko/dev/maycast-studio/Apps/MaycastStudio/Maycast Studio/Maycast Studio.xcodeproj",
  );
});

test("XcodeListWindows: parses multiple windows", async () => {
  const message =
    "* tabIdentifier: windowtab1, workspacePath: /a/One.xcodeproj\n" +
    "* tabIdentifier: windowtab2, workspacePath: /b/Two.xcworkspace\n";
  const windows = await xcodeListWindows(stubClient(message));
  assert.deepEqual(
    windows.map((w) => w.tabIdentifier),
    ["windowtab1", "windowtab2"],
  );
  assert.equal(windows[1]!.projectPath, "/b/Two.xcworkspace");
});

test("XcodeGrep: parses key:value record style", async () => {
  const message =
    "* sourceFilePath: /p/My App/ContentView.swift, lineNumber: 42, text: #Preview {\n" +
    "* sourceFilePath: /p/My App/Settings.swift, lineNumber: 8, text: #Preview {\n";
  const matches = await xcodeGrep(stubClient(message), "#Preview");
  assert.equal(matches.length, 2);
  assert.equal(matches[0]!.path, "/p/My App/ContentView.swift");
  assert.equal(matches[0]!.line, 42);
});

test("XcodeGrep: parses structured results array (real format)", async () => {
  const matches = await xcodeGrep(
    stubStructured({
      matchCount: 124,
      pattern: "#Preview",
      results: [
        "Maycast Studio/Maycast Studio/ContentView.swift",
        "Maycast Studio/Maycast Studio/HomeView.swift",
      ],
      truncated: false,
    }),
    "#Preview",
  );
  assert.equal(matches.length, 2);
  assert.equal(matches[0]!.path, "Maycast Studio/Maycast Studio/ContentView.swift");
});

test("XcodeGrep: treats 'No matches found' sentinel as empty", async () => {
  const matches = await xcodeGrep(
    stubStructured({
      matchCount: 0,
      pattern: "PreviewProvider",
      results: ["No matches found", "No matches found"],
    }),
    "PreviewProvider",
  );
  assert.equal(matches.length, 0);
});

test("XcodeGrep: parses classic path:line:text fallback", async () => {
  const message = "/p/ContentView.swift:42: #Preview { ContentView() }\n";
  const matches = await xcodeGrep(stubClient(message), "#Preview");
  assert.equal(matches.length, 1);
  assert.equal(matches[0]!.path, "/p/ContentView.swift");
  assert.equal(matches[0]!.line, 42);
});

test("XcodeRead reads the `content` envelope and strips cat -n", async () => {
  // Real XcodeRead returns { content: "<cat -n text>" } as the text block,
  // with no structuredContent.
  const inner = JSON.stringify({
    content: "     1\timport SwiftUI\n     2\t#Preview { ContentView() }",
  });
  const client = {
    callTool: async () => ({ text: inner, isError: false, raw: {} }),
  } as unknown as MCPClient;
  const src = await xcodeRead(client, "App/ContentView.swift", "windowtab1");
  assert.equal(src, "import SwiftUI\n#Preview { ContentView() }");
});

test("stripCatN removes cat -n line-number prefixes", () => {
  const input = "     1\timport SwiftUI\n     2\t\n     3\t#Preview { ContentView() }";
  assert.equal(stripCatN(input), "import SwiftUI\n\n#Preview { ContentView() }");
});

test("RenderPreview: extracts snapshot path from message", async () => {
  const message =
    "* previewSnapshotPath: /var/folders/xx/preview-0.png\n";
  const r = await renderPreview(stubClient(message), {
    sourceFilePath: "/p/ContentView.swift",
    previewDefinitionIndexInFile: 0,
  });
  assert.equal(r.previewSnapshotPath, "/var/folders/xx/preview-0.png");
});

test("RenderPreview: falls back to a bare .png path in the message", async () => {
  const message = "Rendered preview to /tmp/snap 1/out.png successfully";
  const r = await renderPreview(stubClient(message), {
    sourceFilePath: "/p/ContentView.swift",
    previewDefinitionIndexInFile: 1,
  });
  assert.equal(r.previewSnapshotPath, "/tmp/snap 1/out.png");
});

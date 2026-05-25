import test from "node:test";
import assert from "node:assert/strict";

import { isResponse, makeRequest, JsonRpcError } from "../src/jsonrpc.js";
import { normalizeToolResult } from "../src/mcpClient.js";
import { toolResultJSON } from "../src/mcpTools.js";

test("makeRequest builds a 2.0 envelope", () => {
  const req = makeRequest(1, "initialize", { a: 1 });
  assert.equal(req.jsonrpc, "2.0");
  assert.equal(req.id, 1);
  assert.equal(req.method, "initialize");
  assert.deepEqual(req.params, { a: 1 });
});

test("isResponse distinguishes responses from requests", () => {
  assert.ok(isResponse({ jsonrpc: "2.0", id: 1, result: null }));
  assert.ok(!isResponse({ jsonrpc: "2.0", id: 1, method: "x" }));
  assert.ok(!isResponse({ hello: "world" }));
});

test("JsonRpcError carries code and data", () => {
  const err = new JsonRpcError({ code: -32000, message: "boom", data: "x" });
  assert.equal(err.code, -32000);
  assert.equal(err.message, "boom");
  assert.equal(err.data, "x");
});

test("normalizeToolResult concatenates text content", () => {
  const result = normalizeToolResult({
    content: [
      { type: "text", text: "line1" },
      { type: "text", text: "line2" },
    ],
    isError: false,
  });
  assert.equal(result.text, "line1\nline2");
  assert.equal(result.isError, false);
});

test("normalizeToolResult surfaces structured content and error flag", () => {
  const result = normalizeToolResult({
    content: [],
    isError: true,
    structuredContent: { previewSnapshotPath: "/tmp/x.png" },
  });
  assert.equal(result.isError, true);
  assert.deepEqual(result.structured, { previewSnapshotPath: "/tmp/x.png" });
});

test("toolResultJSON prefers structured, else parses text JSON", () => {
  assert.deepEqual(
    toolResultJSON({ text: "", isError: false, raw: null, structured: { a: 1 } }),
    { a: 1 },
  );
  assert.deepEqual(
    toolResultJSON({ text: '{"b":2}', isError: false, raw: null }),
    { b: 2 },
  );
  assert.equal(
    toolResultJSON({ text: "plain text", isError: false, raw: null }),
    "plain text",
  );
});

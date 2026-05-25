/**
 * JSON-RPC 2.0 message types and helpers.
 *
 * The Xcode MCP server speaks JSON-RPC 2.0 over stdio. Messages are newline
 * delimited (see {@link Transport}). This module only models the wire format;
 * transport and correlation live elsewhere.
 */

export type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONValue[]
  | { [key: string]: JSONValue };

export type RequestId = number | string;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: string;
  params?: JSONValue;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: JSONValue;
}

export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: JSONValue;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: RequestId | null;
  result?: JSONValue;
  error?: JsonRpcErrorObject;
}

export type JsonRpcMessage =
  | JsonRpcRequest
  | JsonRpcNotification
  | JsonRpcResponse;

export function makeRequest(
  id: RequestId,
  method: string,
  params?: JSONValue,
): JsonRpcRequest {
  const req: JsonRpcRequest = { jsonrpc: "2.0", id, method };
  if (params !== undefined) req.params = params;
  return req;
}

export function makeNotification(
  method: string,
  params?: JSONValue,
): JsonRpcNotification {
  const note: JsonRpcNotification = { jsonrpc: "2.0", method };
  if (params !== undefined) note.params = params;
  return note;
}

export function isResponse(msg: unknown): msg is JsonRpcResponse {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as { jsonrpc?: unknown }).jsonrpc === "2.0" &&
    "id" in msg &&
    !("method" in msg)
  );
}

/** Error thrown when the peer returns a JSON-RPC error object. */
export class JsonRpcError extends Error {
  readonly code: number;
  readonly data?: JSONValue;

  constructor(error: JsonRpcErrorObject) {
    super(error.message);
    this.name = "JsonRpcError";
    this.code = error.code;
    this.data = error.data;
  }
}

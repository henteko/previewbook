import {
  JsonRpcError,
  isResponse,
  makeNotification,
  makeRequest,
} from "./jsonrpc.js";
import type {
  JSONValue,
  JsonRpcResponse,
  RequestId,
} from "./jsonrpc.js";
import { Transport } from "./transport.js";
import type { TransportOptions } from "./transport.js";
import { log } from "./logging.js";

const PROTOCOL_VERSION = "2024-11-05";
const CLIENT_INFO = { name: "previewbook", version: "0.1.0" };

interface Pending {
  resolve: (value: JSONValue) => void;
  reject: (reason: Error) => void;
  timer?: NodeJS.Timeout;
}

export interface ToolCallResult {
  /** Concatenated text content blocks, if any. */
  text: string;
  /** Structured content if the server provided it. */
  structured?: JSONValue;
  /** Whether the server flagged the call as an error. */
  isError: boolean;
  /** The raw tool result object. */
  raw: JSONValue;
}

export interface MCPClientOptions extends TransportOptions {
  /** Per-request timeout in milliseconds. 0 disables the timeout. */
  requestTimeoutMs?: number;
}

/**
 * Minimal MCP client over a stdio JSON-RPC transport.
 *
 * Responsibilities: perform the `initialize` handshake, correlate responses to
 * requests by id, and expose `tools/call`. It deliberately knows nothing about
 * specific Xcode tools — see {@link mcpTools}.
 */
export class MCPClient {
  private readonly transport: Transport;
  private readonly requestTimeoutMs: number;
  private readonly pending = new Map<RequestId, Pending>();
  private nextId = 1;
  private closed = false;

  constructor(options: MCPClientOptions = {}) {
    const { requestTimeoutMs, ...transportOptions } = options;
    this.requestTimeoutMs = requestTimeoutMs ?? 120_000;
    this.transport = new Transport(transportOptions);
    this.transport.onMessage((msg) => this.handleMessage(msg));
    this.transport.onExit((code, signal) => this.handleExit(code, signal));
  }

  /** Starts the bridge process and completes the MCP initialize handshake. */
  async connect(): Promise<void> {
    this.transport.start();
    await this.request("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: CLIENT_INFO,
    });
    this.transport.send(makeNotification("notifications/initialized"));
    log.debug("MCP session initialized");
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.transport.close();
    this.rejectAll(new Error("MCP client closed"));
  }

  /** Issues a JSON-RPC request and resolves with its `result`. */
  request(method: string, params?: JSONValue): Promise<JSONValue> {
    if (this.closed) return Promise.reject(new Error("MCP client closed"));
    const id = this.nextId++;
    return new Promise<JSONValue>((resolve, reject) => {
      const pending: Pending = { resolve, reject };
      if (this.requestTimeoutMs > 0) {
        pending.timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`MCP request timed out: ${method}`));
        }, this.requestTimeoutMs);
        pending.timer.unref?.();
      }
      this.pending.set(id, pending);
      this.transport.send(makeRequest(id, method, params));
    });
  }

  /** Calls an MCP tool by name and normalizes the result. */
  async callTool(
    name: string,
    args: Record<string, JSONValue> = {},
  ): Promise<ToolCallResult> {
    log.debug(`tools/call ${name} ${JSON.stringify(args)}`);
    const raw = await this.request("tools/call", { name, arguments: args });
    log.debug(`tools/call ${name} <- ${preview(raw)}`);
    return normalizeToolResult(raw);
  }

  private handleMessage(msg: unknown): void {
    if (!isResponse(msg)) {
      // Server-initiated requests/notifications are not expected for this
      // client; log and ignore.
      log.debug(`ignoring non-response message: ${JSON.stringify(msg)}`);
      return;
    }
    const response = msg as JsonRpcResponse;
    if (response.id === null) return;
    const pending = this.pending.get(response.id);
    if (!pending) {
      log.debug(`response for unknown id ${String(response.id)}`);
      return;
    }
    this.pending.delete(response.id);
    if (pending.timer) clearTimeout(pending.timer);
    if (response.error) {
      pending.reject(new JsonRpcError(response.error));
    } else {
      pending.resolve(response.result ?? null);
    }
  }

  private handleExit(code: number | null, signal: NodeJS.Signals | null): void {
    if (this.closed) return;
    this.closed = true;
    this.rejectAll(
      new Error(
        `MCP bridge exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"})`,
      ),
    );
  }

  private rejectAll(error: Error): void {
    for (const [, pending] of this.pending) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

/**
 * Normalizes an MCP `tools/call` result into text + optional structured data.
 *
 * MCP tool results look like `{ content: [{type:"text", text:"..."}], isError,
 * structuredContent? }`. Some servers return the payload only as JSON text, so
 * callers should be prepared to JSON-parse {@link ToolCallResult.text}.
 */
export function normalizeToolResult(raw: JSONValue): ToolCallResult {
  let text = "";
  let structured: JSONValue | undefined;
  let isError = false;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, JSONValue>;
    if (obj.isError === true) isError = true;
    if ("structuredContent" in obj) structured = obj.structuredContent;

    const content = obj.content;
    if (Array.isArray(content)) {
      const parts: string[] = [];
      for (const block of content) {
        if (
          block &&
          typeof block === "object" &&
          !Array.isArray(block) &&
          (block as Record<string, JSONValue>).type === "text"
        ) {
          const t = (block as Record<string, JSONValue>).text;
          if (typeof t === "string") parts.push(t);
        }
      }
      text = parts.join("\n");
    }
  }

  return { text, structured, isError, raw };
}

/** Compact JSON preview for debug logging of raw tool results. */
function preview(value: JSONValue, max = 4000): string {
  let s: string;
  try {
    s = JSON.stringify(value);
  } catch {
    s = String(value);
  }
  return s.length > max ? s.slice(0, max) + `… (${s.length} chars)` : s;
}

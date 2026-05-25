import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";

import type { JsonRpcMessage } from "./jsonrpc.js";
import { log } from "./logging.js";

export interface TransportOptions {
  /** Executable to launch. Defaults to `xcrun`. */
  command?: string;
  /**
   * Arguments. Defaults to `["mcpbridge"]`, i.e. `xcrun mcpbridge`, which the
   * design specifies as the stdio bridge to the Xcode MCP server.
   */
  args?: string[];
  /** Working directory for the child process. */
  cwd?: string;
  /** Extra environment variables merged over the inherited environment. */
  env?: Record<string, string>;
}

type MessageHandler = (message: JsonRpcMessage) => void;
type ExitHandler = (code: number | null, signal: NodeJS.Signals | null) => void;

/**
 * Owns the MCP bridge subprocess and frames JSON-RPC 2.0 messages over stdio.
 *
 * Framing is newline-delimited JSON: each message is a single line of UTF-8
 * JSON terminated by `\n`. This matches the MCP stdio transport convention.
 */
export class Transport {
  private readonly command: string;
  private readonly args: string[];
  private readonly cwd?: string;
  private readonly env?: Record<string, string>;

  private child?: ChildProcessWithoutNullStreams;
  private stdoutBuffer = "";
  private messageHandler?: MessageHandler;
  private exitHandler?: ExitHandler;

  constructor(options: TransportOptions = {}) {
    this.command = options.command ?? "xcrun";
    this.args = options.args ?? ["mcpbridge"];
    this.cwd = options.cwd;
    this.env = options.env;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  onExit(handler: ExitHandler): void {
    this.exitHandler = handler;
  }

  start(): void {
    if (this.child) throw new Error("Transport already started");

    log.debug(`launching: ${this.command} ${this.args.join(" ")}`);
    const child = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: this.env ? { ...process.env, ...this.env } : process.env,
      stdio: ["pipe", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;
    this.child = child;

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => this.ingest(chunk));

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      const text = chunk.trimEnd();
      if (text) log.debug(`[bridge] ${text}`);
    });

    child.on("error", (err) => {
      log.error(`bridge process error: ${err.message}`);
    });

    child.on("exit", (code, signal) => {
      log.debug(`bridge exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
      this.exitHandler?.(code, signal);
    });
  }

  /** Serializes and writes one JSON-RPC message followed by a newline. */
  send(message: JsonRpcMessage): void {
    const child = this.child;
    if (!child) throw new Error("Transport not started");
    const line = JSON.stringify(message) + "\n";
    child.stdin.write(line);
  }

  close(): void {
    const child = this.child;
    if (!child) return;
    try {
      child.stdin.end();
    } catch {
      // ignore
    }
    child.kill();
    this.child = undefined;
  }

  private ingest(chunk: string): void {
    this.stdoutBuffer += chunk;
    let newlineIndex: number;
    while ((newlineIndex = this.stdoutBuffer.indexOf("\n")) >= 0) {
      const line = this.stdoutBuffer.slice(0, newlineIndex).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
      if (!line) continue;
      let parsed: JsonRpcMessage;
      try {
        parsed = JSON.parse(line) as JsonRpcMessage;
      } catch {
        log.warn(`dropping non-JSON line from bridge: ${truncate(line, 200)}`);
        continue;
      }
      this.messageHandler?.(parsed);
    }
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) + "…" : value;
}

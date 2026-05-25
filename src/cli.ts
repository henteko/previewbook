#!/usr/bin/env node
import { runBuild, runServe } from "./runner.js";
import type { RunnerOptions, ServeOptions } from "./runner.js";
import { setLogLevel, log } from "./logging.js";

const VERSION = "0.1.0";

const HELP = `previewbook ${VERSION}
Browse SwiftUI previews as a hierarchical, searchable website.

USAGE
  previewbook [options]            Snapshot previews and serve them locally.
  previewbook build -o <path>      Snapshot previews and write a static site.

OPTIONS
  -o, --output <path>   Output directory (required for "build").
      --project <hint>  Disambiguate when multiple Xcode windows are open.
      --title <text>    Override the site title.
      --port <number>   Port for the local server (serve only; default: random).
      --no-open         Do not open the browser automatically (serve only).
      --timeout <sec>   Per-preview render timeout passed to RenderPreview.
  -v, --verbose         Verbose logging.
  -h, --help            Show this help.
      --version         Show version.

ENVIRONMENT
  PREVIEWBOOK_BRIDGE_CMD    Override the MCP bridge command (default: xcrun).
  PREVIEWBOOK_BRIDGE_ARGS   Space-separated bridge args (default: mcpbridge).
`;

interface ParsedArgs {
  command: "serve" | "build";
  output?: string;
  project?: string;
  title?: string;
  port?: number;
  open: boolean;
  timeout?: number;
  verbose: boolean;
  help: boolean;
  version: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: "serve",
    open: true,
    verbose: false,
    help: false,
    version: false,
  };

  const args = [...argv];
  if (args[0] === "build") {
    parsed.command = "build";
    args.shift();
  } else if (args[0] === "serve") {
    args.shift();
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const [flag, inlineValue] = splitInline(arg);
    const value = () => inlineValue ?? args[++i];

    switch (flag) {
      case "-o":
      case "--output":
        parsed.output = required(flag, value());
        break;
      case "--project":
        parsed.project = required(flag, value());
        break;
      case "--title":
        parsed.title = required(flag, value());
        break;
      case "--port":
        parsed.port = toInt(flag, required(flag, value()));
        break;
      case "--timeout":
        parsed.timeout = toInt(flag, required(flag, value()));
        break;
      case "--no-open":
        parsed.open = false;
        break;
      case "-v":
      case "--verbose":
        parsed.verbose = true;
        break;
      case "-h":
      case "--help":
        parsed.help = true;
        break;
      case "--version":
        parsed.version = true;
        break;
      default:
        throw new UsageError(`Unknown option: ${flag}`);
    }
  }
  return parsed;
}

function splitInline(arg: string): [string, string | undefined] {
  if (arg.startsWith("--") && arg.includes("=")) {
    const idx = arg.indexOf("=");
    return [arg.slice(0, idx), arg.slice(idx + 1)];
  }
  return [arg, undefined];
}

function required(flag: string, value: string | undefined): string {
  if (value === undefined) throw new UsageError(`${flag} requires a value`);
  return value;
}

function toInt(flag: string, value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) throw new UsageError(`${flag} expects a number`);
  return n;
}

class UsageError extends Error {}

function bridgeFromEnv(): Pick<RunnerOptions, "bridgeCommand" | "bridgeArgs"> {
  const out: Pick<RunnerOptions, "bridgeCommand" | "bridgeArgs"> = {};
  const cmd = process.env.PREVIEWBOOK_BRIDGE_CMD;
  if (cmd) out.bridgeCommand = cmd;
  const rawArgs = process.env.PREVIEWBOOK_BRIDGE_ARGS;
  if (rawArgs) out.bridgeArgs = rawArgs.split(/\s+/).filter(Boolean);
  return out;
}

async function main(): Promise<void> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof UsageError) {
      process.stderr.write(`${err.message}\n\n${HELP}`);
      process.exit(2);
    }
    throw err;
  }

  if (parsed.help) {
    process.stdout.write(HELP);
    return;
  }
  if (parsed.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  if (parsed.verbose) setLogLevel("debug");

  const base: RunnerOptions = {
    ...bridgeFromEnv(),
  };
  if (parsed.project) base.projectHint = parsed.project;
  if (parsed.title) base.title = parsed.title;
  if (parsed.timeout !== undefined) base.renderTimeout = parsed.timeout;

  if (parsed.command === "build") {
    if (!parsed.output) {
      process.stderr.write(`build requires -o <path>\n\n${HELP}`);
      process.exit(2);
    }
    await runBuild(parsed.output, base);
    return;
  }

  // serve (default)
  const serveOptions: ServeOptions = { ...base, openBrowser: parsed.open };
  if (parsed.port !== undefined) serveOptions.port = parsed.port;
  const server = await runServe(serveOptions);
  log.info("press Ctrl+C to stop");

  const shutdown = () => {
    void server.close().then(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  log.error((err as Error).message);
  process.exit(1);
});

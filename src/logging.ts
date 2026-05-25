/**
 * Leveled logging to stderr. stdout is reserved for clean output so the tool
 * can be composed in pipelines without log noise leaking into data.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let minimum: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  minimum = level;
}

function emit(level: LogLevel, symbol: string, message: string): void {
  if (ORDER[level] < ORDER[minimum]) return;
  process.stderr.write(`${symbol} ${message}\n`);
}

export const log = {
  debug: (message: string) => emit("debug", "·", message),
  info: (message: string) => emit("info", "›", message),
  warn: (message: string) => emit("warn", "!", message),
  error: (message: string) => emit("error", "✗", message),
};

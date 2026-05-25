/**
 * Parses SwiftUI preview definitions out of source text.
 *
 * Two forms are recognized, in source order:
 *   - `#Preview` macros (optionally with a label and trailing closure)
 *   - `PreviewProvider` conforming types
 *
 * The 0-based source order is exposed as {@link PreviewDefinition.index} and is
 * assumed to match the Xcode MCP server's `previewDefinitionIndexInFile`.
 *
 * The parser first blanks out comments and string-literal *contents* (preserving
 * offsets and newlines) so that braces/parentheses inside strings or comments
 * never confuse delimiter matching. Snippets are then sliced from the original
 * source so labels and code read exactly as written.
 */

export type PreviewKind = "macro" | "provider";

export interface PreviewDefinition {
  /** 0-based source-order index (matches `previewDefinitionIndexInFile`). */
  index: number;
  kind: PreviewKind;
  /** Explicit `#Preview("…")` label, or a name derived from a provider type. */
  label?: string;
  /** Best-effort previewed View type. */
  targetType?: string;
  /** Exact source snippet of the definition. */
  source: string;
  /** 1-based inclusive start line. */
  startLine: number;
  /** 1-based inclusive end line. */
  endLine: number;
}

interface StringSpan {
  start: number; // index of opening quote run
  end: number; // index just past the closing quote run
  content: string; // decoded inner text (best effort)
}

interface Sanitized {
  /** Source with comments and string contents replaced by spaces. */
  code: string;
  /** Recorded string literal spans (for label extraction). */
  strings: StringSpan[];
}

export function parsePreviewDefinitions(source: string): PreviewDefinition[] {
  const { code, strings } = sanitizeSwift(source);
  const raw: Array<Omit<PreviewDefinition, "index">> = [];

  collectMacros(source, code, strings, raw);
  collectProviders(source, code, raw);

  raw.sort((a, b) => sourceStart(source, a) - sourceStart(source, b));
  return raw.map((def, index) => ({ index, ...def }));
}

// Used only for stable ordering; recomputes the byte offset of a snippet's
// start. Snippets are unique enough in practice; ties fall back to label.
function sourceStart(
  source: string,
  def: Omit<PreviewDefinition, "index">,
): number {
  return lineStartOffset(source, def.startLine);
}

// MARK: - Macro detection

function collectMacros(
  source: string,
  code: string,
  strings: StringSpan[],
  out: Array<Omit<PreviewDefinition, "index">>,
): void {
  const re = /#Preview\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const start = m.index;
    let cursor = start + m[0].length;

    let argEnd = cursor;
    let label: string | undefined;
    cursor = skipWhitespace(code, cursor);
    if (code[cursor] === "(") {
      const close = matchDelimiter(code, cursor, "(", ")");
      if (close < 0) continue;
      argEnd = close + 1;
      label = firstStringInRange(strings, cursor, close);
      cursor = skipWhitespace(code, argEnd);
    }

    let end = argEnd;
    if (code[cursor] === "{") {
      const close = matchDelimiter(code, cursor, "{", "}");
      if (close < 0) continue;
      end = close + 1;
    }

    const snippet = source.slice(start, end);
    const def: Omit<PreviewDefinition, "index"> = {
      kind: "macro",
      source: snippet,
      startLine: lineAt(source, start),
      endLine: lineAt(source, end - 1),
    };
    if (label) def.label = label;
    const targetType = firstViewType(code, source, start, end);
    if (targetType) def.targetType = targetType;
    out.push(def);
  }
}

// MARK: - PreviewProvider detection

function collectProviders(
  source: string,
  code: string,
  out: Array<Omit<PreviewDefinition, "index">>,
): void {
  const re = /\bstruct\s+(\w+)\s*:\s*([^{]*?)\bPreviewProvider\b[^{]*?\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const structName = m[1] ?? "";
    const start = m.index;
    const braceOpen = start + m[0].length - 1;
    const close = matchDelimiter(code, braceOpen, "{", "}");
    if (close < 0) continue;
    const end = close + 1;

    const def: Omit<PreviewDefinition, "index"> = {
      kind: "provider",
      label: deriveProviderName(structName),
      source: source.slice(start, end),
      startLine: lineAt(source, start),
      endLine: lineAt(source, end - 1),
    };
    const targetType = firstViewType(code, source, braceOpen, end);
    if (targetType) def.targetType = targetType;
    out.push(def);
  }
}

function deriveProviderName(structName: string): string {
  for (const suffix of ["_Previews", "_Preview", "Previews", "Preview"]) {
    if (structName.endsWith(suffix) && structName.length > suffix.length) {
      return structName.slice(0, structName.length - suffix.length);
    }
  }
  return structName;
}

// MARK: - Shared helpers

/** First `Capitalized(` call inside [from, to) — a heuristic for the View. */
function firstViewType(
  code: string,
  source: string,
  from: number,
  to: number,
): string | undefined {
  const region = code.slice(from, to);
  const re = /\b([A-Z]\w*)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(region)) !== null) {
    const name = m[1] ?? "";
    // Skip a few common non-View constructors that may appear.
    if (name === "Preview" || name === "Group") continue;
    // Map back to the original source to preserve exact casing/generics.
    const absolute = from + m.index;
    return source.slice(absolute, absolute + name.length);
  }
  return undefined;
}

function firstStringInRange(
  strings: StringSpan[],
  parenOpen: number,
  parenClose: number,
): string | undefined {
  for (const span of strings) {
    if (span.start > parenOpen && span.end <= parenClose + 1) {
      return span.content;
    }
  }
  return undefined;
}

function skipWhitespace(code: string, index: number): number {
  let i = index;
  while (i < code.length && /\s/.test(code[i] ?? "")) i++;
  return i;
}

/** Matches a delimiter pair starting at `openIndex`; returns close index. */
function matchDelimiter(
  code: string,
  openIndex: number,
  open: string,
  close: string,
): number {
  let depth = 0;
  for (let i = openIndex; i < code.length; i++) {
    const ch = code[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function lineAt(source: string, index: number): number {
  let line = 1;
  const bound = Math.min(index, source.length);
  for (let i = 0; i < bound; i++) {
    if (source[i] === "\n") line++;
  }
  return line;
}

function lineStartOffset(source: string, line: number): number {
  if (line <= 1) return 0;
  let current = 1;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n") {
      current++;
      if (current === line) return i + 1;
    }
  }
  return source.length;
}

/**
 * Replaces comment and string-literal contents with spaces (offsets and
 * newlines preserved), and records string spans with decoded content.
 */
function sanitizeSwift(source: string): Sanitized {
  const chars = source.split("");
  const strings: StringSpan[] = [];
  const n = source.length;
  let i = 0;

  const blank = (from: number, to: number) => {
    for (let k = from; k < to && k < n; k++) {
      if (chars[k] !== "\n") chars[k] = " ";
    }
  };

  while (i < n) {
    const ch = source[i];

    // Line comment
    if (ch === "/" && source[i + 1] === "/") {
      let j = i + 2;
      while (j < n && source[j] !== "\n") j++;
      blank(i, j);
      i = j;
      continue;
    }

    // Block comment (nestable)
    if (ch === "/" && source[i + 1] === "*") {
      let depth = 1;
      let j = i + 2;
      while (j < n && depth > 0) {
        if (source[j] === "/" && source[j + 1] === "*") {
          depth++;
          j += 2;
        } else if (source[j] === "*" && source[j + 1] === "/") {
          depth--;
          j += 2;
        } else {
          j++;
        }
      }
      blank(i, j);
      i = j;
      continue;
    }

    // String literal, possibly raw (leading #) and/or multiline (""").
    if (ch === "#" || ch === '"') {
      const parsed = parseStringLiteral(source, i);
      if (parsed) {
        strings.push({
          start: i,
          end: parsed.end,
          content: parsed.content,
        });
        blank(i, parsed.end);
        i = parsed.end;
        continue;
      }
    }

    i++;
  }

  return { code: chars.join(""), strings };
}

interface ParsedString {
  end: number; // index just past closing run
  content: string;
}

function parseStringLiteral(source: string, start: number): ParsedString | null {
  const n = source.length;
  let i = start;

  // Count leading '#' (raw string delimiters).
  let hashes = 0;
  while (source[i] === "#") {
    hashes++;
    i++;
  }
  if (source[i] !== '"') return null;

  const multiline = source.slice(i, i + 3) === '"""';
  const quoteRun = multiline ? '"""' : '"';
  const terminator = quoteRun + "#".repeat(hashes);
  const raw = hashes > 0;

  let j = i + quoteRun.length;
  const contentStart = j;
  while (j < n) {
    // Escape handling only for non-raw strings.
    if (!raw && source[j] === "\\") {
      j += 2;
      continue;
    }
    if (source.slice(j, j + terminator.length) === terminator) {
      const content = decodeSimple(source.slice(contentStart, j), raw);
      return { end: j + terminator.length, content };
    }
    // A non-multiline string must not contain a raw newline.
    if (!multiline && source[j] === "\n") return null;
    j++;
  }
  return null;
}

function decodeSimple(inner: string, raw: boolean): string {
  if (raw) return inner;
  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

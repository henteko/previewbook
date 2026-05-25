// Copies non-TS site assets (styles.css, app.js) into dist after tsc, since the
// TypeScript compiler only emits compiled .js/.d.ts and ignores other files.
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "src", "site", "assets");
const to = path.join(root, "dist", "site", "assets");

mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log(`copied site assets -> ${path.relative(root, to)}`);

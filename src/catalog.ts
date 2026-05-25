import type { PreviewDefinition } from "./previewMetadata.js";

/**
 * The `stories.json` data model and the logic that builds it.
 *
 * The tree mirrors the directory structure of the discovered source files
 * (a common path prefix is stripped so the tree starts at the first meaningful
 * directory). Each source file becomes a `component` node; each preview
 * definition within it becomes a `story`.
 */

export interface Manifest {
  title: string;
  generatedAt: string;
  tree: TreeNode[];
}

export type TreeNode = GroupNode | ComponentNode;

export interface GroupNode {
  type: "group";
  name: string;
  children: TreeNode[];
}

export interface ComponentNode {
  type: "component";
  name: string;
  sourceFile: string;
  stories: Story[];
}

export interface Story {
  id: string;
  name: string;
  asset: string;
  source: string;
  file: string;
  index: number;
  targetType?: string;
  /** Definition kind: `#Preview` macro or `PreviewProvider`. */
  kind: "macro" | "provider";
  /** 1-based start line of the definition in its source file. */
  line: number;
  /** 1-based end line of the definition in its source file. */
  endLine: number;
}

/** One rendered preview, the input to {@link buildCatalog}. */
export interface CapturedPreview {
  /** Source file path relative to the project root. Uses `/` separators. */
  sourceFile: string;
  /** Absolute path of the PNG produced by RenderPreview. */
  snapshotPath: string;
  definition: PreviewDefinition;
}

/** A PNG copy instruction: `from` absolute path → site-relative `to`. */
export interface AssetCopy {
  from: string;
  to: string;
}

export interface BuildOptions {
  title: string;
  /** ISO timestamp; defaults to now. */
  generatedAt?: string;
}

export interface BuildResult {
  manifest: Manifest;
  assets: AssetCopy[];
}

export function buildCatalog(
  captures: CapturedPreview[],
  options: BuildOptions,
): BuildResult {
  const normalized = captures.map((c) => ({
    ...c,
    sourceFile: c.sourceFile.replaceAll("\\", "/").replace(/^\.?\//, ""),
  }));

  const prefix = commonDirectoryPrefix(normalized.map((c) => c.sourceFile));

  // Group captures by source file, preserving first-seen order.
  const byFile = new Map<string, typeof normalized>();
  for (const cap of normalized) {
    const list = byFile.get(cap.sourceFile);
    if (list) list.push(cap);
    else byFile.set(cap.sourceFile, [cap]);
  }

  const assets: AssetCopy[] = [];
  const root: GroupNode = { type: "group", name: "", children: [] };

  for (const [file, caps] of byFile) {
    const componentName = baseName(file);
    const relPath = stripPrefix(file, prefix);
    const dirs = dirSegments(relPath);

    const stories: Story[] = [];
    const usedIds = new Set<string>();
    for (const cap of caps) {
      const asset = `assets/${slug(componentName)}_${cap.definition.index}.png`;
      assets.push({ from: cap.snapshotPath, to: asset });
      const name = storyName(cap.definition);
      const id = uniqueId(componentName, name, cap.definition.index, usedIds);
      const story: Story = {
        id,
        name,
        asset,
        source: cap.definition.source,
        file,
        index: cap.definition.index,
        kind: cap.definition.kind,
        line: cap.definition.startLine,
        endLine: cap.definition.endLine,
      };
      if (cap.definition.targetType) story.targetType = cap.definition.targetType;
      stories.push(story);
    }

    const component: ComponentNode = {
      type: "component",
      name: componentName,
      sourceFile: file,
      stories,
    };
    insertComponent(root, dirs, component);
  }

  return {
    manifest: {
      title: options.title,
      generatedAt: options.generatedAt ?? new Date().toISOString(),
      tree: root.children,
    },
    assets,
  };
}

// MARK: - Tree building

function insertComponent(
  root: GroupNode,
  dirs: string[],
  component: ComponentNode,
): void {
  let node = root;
  for (const dir of dirs) {
    let child = node.children.find(
      (c): c is GroupNode => c.type === "group" && c.name === dir,
    );
    if (!child) {
      child = { type: "group", name: dir, children: [] };
      node.children.push(child);
    }
    node = child;
  }
  node.children.push(component);
}

// MARK: - Naming

function storyName(def: PreviewDefinition): string {
  if (def.label && def.label.trim()) return def.label.trim();
  if (def.kind === "provider") return "Preview";
  return `Preview ${def.index + 1}`;
}

function uniqueId(
  component: string,
  name: string,
  index: number,
  used: Set<string>,
): string {
  const base = `${slug(component)}-${slug(name)}`;
  let id = base;
  if (used.has(id)) id = `${base}-${index}`;
  used.add(id);
  return id;
}

export function slug(value: string): string {
  const s = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

// MARK: - Path helpers

function baseName(path: string): string {
  const file = path.split("/").pop() ?? path;
  return file.replace(/\.[^.]+$/, "");
}

function dirSegments(path: string): string[] {
  const parts = path.split("/");
  parts.pop(); // drop file name
  return parts.filter((p) => p.length > 0);
}

function stripPrefix(path: string, prefix: string): string {
  if (prefix && path.startsWith(prefix)) {
    return path.slice(prefix.length);
  }
  return path;
}

/** Longest shared directory prefix (ending in `/`) across all paths. */
export function commonDirectoryPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  if (paths.length === 1) {
    const idx = paths[0]!.lastIndexOf("/");
    return idx >= 0 ? paths[0]!.slice(0, idx + 1) : "";
  }
  let prefix = paths[0]!;
  for (const path of paths.slice(1)) {
    while (!path.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  // Trim back to the last directory separator.
  const idx = prefix.lastIndexOf("/");
  return idx >= 0 ? prefix.slice(0, idx + 1) : "";
}

// ui.jsx — Sidebar, Canvas, Inspector, TopBar, Lightbox, CommandPalette

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─────────── small icons ───────────
const I = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  chev:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  folder: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></svg>,
  comp:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  sun:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>,
  zoomIn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/></svg>,
  zoomOut:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/></svg>,
  fit:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9V5h4M21 9V5h-4M3 15v4h4M21 15v4h-4"/></svg>,
  expand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>,
  close:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  download:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16"/></svg>,
  prev:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  next:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  copy:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  ruler:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="M7.5 12.5 9 14M10 10l2 2M12.5 7.5 14 9"/></svg>,
  pin:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5M5 9l7-7 7 7-3 1v6H8V10L5 9Z"/></svg>,
};

// ─────────── Top bar ───────────
function TopBar({ theme, onTheme, onCmdK, generatedAt }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">P</div>
        previewbook
        <div className="brand-meta">MyApp · 24 stories</div>
      </div>
      <div className="spacer"></div>
      <div className="cmdk" role="button" onClick={onCmdK}>
        {I.search}
        <span className="cmdk-text">Search components, stories…</span>
        <span className="kbd">⌘K</span>
      </div>
      <div className="spacer"></div>
      <button className="tbtn" title="Toggle theme" onClick={onTheme}>{theme === "dark" ? I.sun : I.moon}</button>
    </header>
  );
}

// ─────────── Sidebar ───────────
function Sidebar({ tree, selectedId, onSelect, density }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState({}); // {id: bool}
  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  // Filtered tree
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return tree;
    return tree.map((g) => {
      const children = g.children
        .map((c) => {
          const matchedStories = c.stories.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              c.component.toLowerCase().includes(q)
          );
          if (matchedStories.length || c.component.toLowerCase().includes(q)) {
            return { ...c, stories: c.component.toLowerCase().includes(q) ? c.stories : matchedStories };
          }
          return null;
        })
        .filter(Boolean);
      return { ...g, children };
    }).filter((g) => g.children.length > 0);
  }, [tree, q]);

  return (
    <aside className={"sidebar " + (density === "compact" ? "sb-density-compact" : "")}>
      <div className="sb-search">
        <label className="sb-input">
          {I.search}
          <input
            placeholder="Filter stories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <span style={{ color: "var(--fg-faint)", cursor: "pointer", fontSize: 14 }} onClick={() => setQuery("")}>×</span>
          )}
        </label>
      </div>
      <div className="sb-tree">
        {filtered.length === 0 && <div className="sb-empty">No matches</div>}
        {filtered.map((group) => {
          const isCol = !!collapsed["g:" + group.name];
          return (
            <div key={group.name} style={{ marginBottom: 4 }}>
              <div
                className={"sb-group-h" + (isCol ? " is-collapsed" : "")}
                onClick={() => toggle("g:" + group.name)}
                style={{ cursor: "default" }}
              >
                <span className="chev">{I.chev}</span>
                {group.name}
              </div>
              {!isCol && group.children.map((c) => {
                const isComp = !!collapsed["c:" + c.component];
                const hasSelected = c.stories.some((s) => s.id === selectedId);
                return (
                  <div key={c.component}>
                    <div
                      className={"sb-item is-component" + (isComp && !hasSelected ? " is-collapsed" : "")}
                      onClick={() => toggle("c:" + c.component)}
                    >
                      <span className="chev">{I.chev}</span>
                      <span className="gicon">{I.comp}</span>
                      <span>{c.component}</span>
                      <span style={{ marginLeft: "auto", color: "var(--fg-faint)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                        {c.stories.length}
                      </span>
                    </div>
                    {(!isComp || hasSelected) && c.stories.map((s) => (
                      <div
                        key={s.id}
                        className={"sb-story" + (s.id === selectedId ? " is-selected" : "")}
                        onClick={() => onSelect(s.id)}
                      >
                        <span className="dot"></span>
                        <span className="label">{s.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ─────────── Canvas + Lightbox ───────────
function Canvas({ story, onPrev, onNext, onOpenLightbox, totalIndex, totalCount }) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => { setZoom(1); }, [story.id]);

  const MockPreview = window.PreviewbookMocks.MockPreview;
  const isComponent = story.componentKind === "Component";

  return (
    <section className="canvas">
      <div className="canvas-head">
        <div className="crumb">
          <span>{story.component}</span>
          <span className="sep">/</span>
          <span className="last">{story.name}</span>
          <span className="crumb-tag">{story.canvasSize[0]}×{story.canvasSize[1]}</span>
        </div>
        <button className="tbtn" title="Open lightbox" onClick={onOpenLightbox}>{I.expand}</button>
        <button className="tbtn" title="Download PNG">{I.download}</button>
      </div>

      <div className="canvas-body">
        <div className="snap-card">
          <div className={"snap-frame" + (isComponent ? " is-component" : "")} style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
            <MockPreview story={story} />
          </div>
          <div className="snap-label">{story.mock.kind}_{story.indexInFile}.png · {story.canvasSize[0]}×{story.canvasSize[1]} · {story.durationMs}ms</div>
        </div>
      </div>

      <div className="canvas-foot">
        <div className="nav-group">
          <button className="tbtn" title="Previous story" onClick={onPrev}>{I.prev}</button>
          <span className="nav-label">{String(totalIndex + 1).padStart(2,"0")} / {String(totalCount).padStart(2,"0")}</span>
          <button className="tbtn" title="Next story" onClick={onNext}>{I.next}</button>
        </div>
        <div className="spacer"></div>
        <div className="zoom-group">
          <button className="tbtn" title="Zoom out" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}>{I.zoomOut}</button>
          <span className="zoom-val">{Math.round(zoom * 100)}%</span>
          <button className="tbtn" title="Zoom in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}>{I.zoomIn}</button>
          <button className="tbtn" title="Fit" onClick={() => setZoom(1)}>{I.fit}</button>
        </div>
      </div>
    </section>
  );
}

function Lightbox({ story, onClose, onPrev, onNext }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, onPrev, onNext]);

  const MockPreview = window.PreviewbookMocks.MockPreview;
  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-meta" onClick={(e) => e.stopPropagation()}>
        <b>{story.component}</b>
        <span style={{ color: "var(--fg-faint)" }}>·</span>
        <span>{story.name}</span>
        <span style={{ color: "var(--fg-faint)" }}>·</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{story.canvasSize[0]}×{story.canvasSize[1]}</span>
      </div>
      <button className="lb-close" onClick={onClose}>{I.close}</button>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="snap-frame" style={{ transform: "scale(1.4)", transformOrigin: "center center" }}>
          <MockPreview story={story} />
        </div>
      </div>
    </div>
  );
}

// ─────────── Inspector ───────────
function syntaxHighlight(src) {
  // very small swift-ish tokenizer
  const tokens = [];
  const patterns = [
    [/\/\/[^\n]*/g, "com"],
    [/"(?:\\.|[^"\\])*"/g, "str"],
    [/\b(struct|class|enum|var|let|func|return|if|else|true|false|nil|self|in|case|switch|some|preferredColorScheme)\b/g, "key"],
    [/#Preview/g, "fn"],
    [/\b([A-Z]\w*)\b/g, "typ"],
    [/\b\d+(\.\d+)?\b/g, "num"],
  ];
  // Apply via a single regex sweep that prefers earliest match
  let pos = 0;
  const text = src;
  const matches = [];
  for (const [re, cls] of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, cls, txt: m[0] });
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  // Remove overlapping (keep first)
  const cleaned = [];
  let last = -1;
  for (const m of matches) {
    if (m.start >= last) {
      cleaned.push(m);
      last = m.end;
    }
  }

  const out = [];
  pos = 0;
  cleaned.forEach((m, i) => {
    if (m.start > pos) out.push(text.slice(pos, m.start));
    out.push(<span key={i} className={"tok-" + m.cls}>{m.txt}</span>);
    pos = m.end;
  });
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

function Inspector({ story, pinned, onTogglePin }) {
  const [tab, setTab] = useState("source");
  const [copied, setCopied] = useState(false);

  const lines = story.source.split("\n");
  const startLn = story.lineRange[0];

  const copy = () => {
    navigator.clipboard?.writeText(story.source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <aside className="inspector">
      <div className="insp-tabs">
        <button className={"insp-tab" + (tab === "source" ? " is-active" : "")} onClick={() => setTab("source")}>Source</button>
        <button className={"insp-tab" + (tab === "info" ? " is-active" : "")} onClick={() => setTab("info")}>Info</button>
        <div style={{ flex: 1 }}></div>
        <button className="tbtn" title={pinned ? "Unpin" : "Pin"} onClick={onTogglePin} style={{ marginRight: -4 }}>
          <span style={{ opacity: pinned ? 1 : 0.5 }}>{I.pin}</span>
        </button>
      </div>

      <div className="insp-body">
        {tab === "source" && (
          <>
            <div className="code-head">
              <span className="file">{story.file.split("/").slice(-1)[0]}<span style={{ color: "var(--fg-faint)" }}>:L{startLn}</span></span>
              <button className="code-copy" onClick={copy}>
                {I.copy}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block">{lines.map((ln, i) => (
              <div key={i}><span className="ln">{startLn + i}</span>{syntaxHighlight(ln)}</div>
            ))}</pre>

            <div className="insp-section">
              <div className="insp-section-h">Story</div>
              <div className="meta-row">
                <span className="meta-key">Name</span>
                <span className="meta-val" style={{ fontFamily: "var(--font-sans)" }}>{story.name}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Component</span>
                <span className="meta-val">{story.component}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Kind</span>
                <span className="meta-val" style={{ fontFamily: "var(--font-sans)" }}>
                  <span className="pill">{story.componentKind}</span>
                </span>
              </div>
            </div>
          </>
        )}

        {tab === "info" && (
          <>
            <div className="insp-section">
              <div className="insp-section-h">Source</div>
              <div className="meta-row"><span className="meta-key">File</span><span className="meta-val">{story.file}</span></div>
              <div className="meta-row"><span className="meta-key">Lines</span><span className="meta-val">L{story.lineRange[0]}–L{story.lineRange[1]}</span></div>
              <div className="meta-row"><span className="meta-key">Preview #</span><span className="meta-val">{story.indexInFile}</span></div>
            </div>
            <div className="insp-section">
              <div className="insp-section-h">Render</div>
              <div className="meta-row"><span className="meta-key">Device</span><span className="meta-val" style={{ fontFamily: "var(--font-sans)" }}>{story.device}</span></div>
              <div className="meta-row"><span className="meta-key">Canvas</span><span className="meta-val">{story.canvasSize[0]}×{story.canvasSize[1]} pt</span></div>
              <div className="meta-row"><span className="meta-key">Appearance</span><span className="meta-val" style={{ fontFamily: "var(--font-sans)" }}>{story.appearance}</span></div>
              <div className="meta-row"><span className="meta-key">Asset</span><span className="meta-val">assets/{story.component}_{story.indexInFile}.png</span></div>
              <div className="meta-row"><span className="meta-key">Captured</span><span className="meta-val" style={{ fontFamily: "var(--font-sans)" }}>{story.renderedAt}</span></div>
              <div className="meta-row"><span className="meta-key">Duration</span><span className="meta-val">{story.durationMs} ms</span></div>
            </div>
            <div className="insp-section">
              <div className="insp-section-h">MCP Call</div>
              <pre className="code-block" style={{ borderTop: 0, borderBottom: 0, background: "var(--bg-sunken)", padding: 12, fontSize: 11 }}>
{syntaxHighlight(`RenderPreview(
  sourceFilePath: "${story.file}",
  previewDefinitionIndexInFile: ${story.indexInFile},
  timeout: 30
)`)}
              </pre>
            </div>
            <div className="insp-section">
              <div className="insp-section-h">Story ID</div>
              <div className="meta-row" style={{ gridTemplateColumns: "1fr" }}>
                <span className="meta-val" style={{ fontSize: 11 }}>{story.id}</span>
              </div>
              <div style={{ color: "var(--fg-faint)", fontSize: 11, marginTop: 6 }}>
                Share via <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-subtle)" }}>#/{story.file.split("/")[1]}/{story.component}/{story.name.replace(/\s/g, "-")}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// ─────────── Command palette ───────────
function CommandPalette({ stories, onPick, onClose }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return stories.slice(0, 12);
    return stories.filter((s) =>
      s.name.toLowerCase().includes(qq) ||
      s.component.toLowerCase().includes(qq) ||
      s.file.toLowerCase().includes(qq)
    ).slice(0, 20);
  }, [q, stories]);

  useEffect(() => { setIdx(0); }, [q]);

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(filtered.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") {
      const s = filtered[idx];
      if (s) { onPick(s.id); onClose(); }
    }
  };

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cp-input">
          {I.search}
          <input
            ref={inputRef}
            placeholder="Search components, stories, files…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKey}
          />
          <span className="kbd">ESC</span>
        </div>
        <div className="cp-list">
          {filtered.length === 0 && <div className="cp-empty">No matches for "{q}"</div>}
          {filtered.map((s, i) => (
            <div
              key={s.id}
              className={"cp-item" + (i === idx ? " is-active" : "")}
              onMouseEnter={() => setIdx(i)}
              onClick={() => { onPick(s.id); onClose(); }}
            >
              <span className="gicon">{I.comp}</span>
              <span><b style={{ color: "var(--fg)", fontWeight: 500 }}>{s.component}</b> <span style={{ color: "var(--fg-faint)", margin: "0 6px" }}>·</span> {s.name}</span>
              <span className="cp-path">{s.file.split("/").slice(-2).join("/")}</span>
            </div>
          ))}
        </div>
        <div className="cp-foot">
          <span className="key"><span className="kbd">↑↓</span> navigate</span>
          <span className="key"><span className="kbd">↵</span> open</span>
          <span className="key"><span className="kbd">ESC</span> close</span>
          <span style={{ marginLeft: "auto" }}>{filtered.length} of {stories.length}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  PBTopBar: TopBar,
  PBSidebar: Sidebar,
  PBCanvas: Canvas,
  PBInspector: Inspector,
  PBLightbox: Lightbox,
  PBCommandPalette: CommandPalette,
});

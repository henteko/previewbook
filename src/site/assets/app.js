/* previewbook SPA — vanilla JS port of docs/design (React mock).
 *
 * Reads the catalog from window.__PREVIEWBOOK_MANIFEST__ (build mode) or
 * fetch('stories.json') (serve mode), then renders a Storybook-like explorer:
 * topbar, sidebar tree, canvas (real snapshot PNG), and a Source/Info inspector,
 * plus a lightbox and a ⌘K command palette.
 *
 * This is the production UI; styling lives in styles.css. To restyle, replace
 * styles.css; to change behaviour or markup, edit this file. The data contract
 * (the stories.json shape) is the stable boundary between tool and UI.
 */
(function () {
  "use strict";

  // ───────── icons (inline SVG, HTML-attribute casing) ─────────
  const svg = (body) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const I = {
    search: svg(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`),
    chev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    folder: svg(`<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/>`),
    comp: svg(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`),
    sun: svg(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>`),
    moon: svg(`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>`),
    zoomIn: svg(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>`),
    zoomOut: svg(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>`),
    fit: svg(`<path d="M3 9V5h4M21 9V5h-4M3 15v4h4M21 15v4h-4"/>`),
    expand: svg(`<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>`),
    close: svg(`<path d="M18 6 6 18M6 6l12 12"/>`),
    download: svg(`<path d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16"/>`),
    prev: svg(`<polyline points="15 18 9 12 15 6"/>`),
    next: svg(`<polyline points="9 18 15 12 9 6"/>`),
    copy: svg(`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`),
  };

  // ───────── helpers ─────────
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  const pad = (n) => String(n).padStart(2, "0");
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const keyOf = (segments) => segments.map(encodeURIComponent).join("/");
  const baseName = (p) => String(p).split("/").pop();

  // ───────── state ─────────
  const state = {
    manifest: null,
    stories: [],
    byKey: {},
    selectedKey: null,
    collapsed: {},
    query: "",
    zoom: 1,
    tab: "source",
    showCP: false,
  };

  let rootEl, treeEl, canvasEl, inspectorEl, searchInput;

  // ───────── boot ─────────
  function boot() {
    rootEl = document.getElementById("root");
    initTheme();
    const embedded = window.__PREVIEWBOOK_MANIFEST__;
    if (embedded) return init(embedded);
    fetch("stories.json")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(init)
      .catch((err) => fatal("Failed to load stories.json: " + err.message));
  }

  function fatal(message) {
    rootEl.innerHTML =
      '<div style="display:grid;place-items:center;height:100vh;color:var(--fg-faint);font-family:var(--font-mono);font-size:13px;padding:24px;text-align:center">' +
      esc(message) +
      "</div>";
  }

  function init(manifest) {
    state.manifest = manifest;
    document.title = manifest.title || "previewbook";
    state.stories = flatten(manifest.tree || []);
    state.byKey = {};
    for (const s of state.stories) state.byKey[s.routeKey] = s;

    renderShell();
    selectKey(keyFromHash() || (state.stories[0] && state.stories[0].routeKey), false);

    window.addEventListener("hashchange", () => {
      const k = keyFromHash();
      if (k && k !== state.selectedKey) selectKey(k, false);
    });
    window.addEventListener("keydown", onGlobalKey);
  }

  // ───────── data ─────────
  function flatten(tree) {
    const out = [];
    (function walk(nodes, trail) {
      for (const node of nodes) {
        if (node.type === "group") {
          walk(node.children || [], trail.concat([node.name]));
        } else if (node.type === "component") {
          for (const story of node.stories || []) {
            const route = trail.concat([node.name, story.name]);
            out.push(
              Object.assign({}, story, {
                component: node.name,
                componentFile: node.sourceFile,
                groups: trail.slice(),
                route,
                routeKey: keyOf(route),
              }),
            );
          }
        }
      }
    })(tree, []);
    return out;
  }

  const currentStory = () => state.byKey[state.selectedKey];
  const keyFromHash = () => {
    const h = location.hash.replace(/^#\/?/, "");
    return h && state.byKey[h] ? h : null;
  };

  function selectKey(key, updateHash) {
    if (!key || !state.byKey[key]) {
      // empty catalog
      renderSidebar();
      renderCanvas();
      renderInspector();
      return;
    }
    state.selectedKey = key;
    state.zoom = 1;
    if (updateHash !== false && location.hash !== "#/" + key) {
      location.hash = "#/" + key;
    }
    renderSidebar();
    renderCanvas();
    renderInspector();
    scrollSelectedIntoView();
  }

  function navTo(delta) {
    const i = state.stories.findIndex((s) => s.routeKey === state.selectedKey);
    if (i < 0) return;
    const n = state.stories.length;
    const ni = (i + delta + n) % n;
    selectKey(state.stories[ni].routeKey, true);
  }

  // ───────── shell ─────────
  function renderShell() {
    const count = state.stories.length;
    const projectName =
      (state.manifest.title || "").replace(/\s*preview\s*book\s*$/i, "").trim() ||
      state.manifest.title ||
      "";
    const meta = (projectName ? projectName + " · " : "") + count + (count === 1 ? " story" : " stories");

    rootEl.innerHTML = `
      <div class="app">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">P</div>
            previewbook
            <div class="brand-meta">${esc(meta)}</div>
          </div>
          <div class="spacer"></div>
          <div class="cmdk" id="pb-cmdk" role="button" tabindex="0">
            ${I.search}
            <span class="cmdk-text">Search components, stories…</span>
            <span class="kbd">⌘K</span>
          </div>
          <div class="spacer"></div>
          <button class="tbtn" id="pb-theme" title="Toggle theme"></button>
        </header>
        <aside class="sidebar">
          <div class="sb-search">
            <label class="sb-input">
              ${I.search}
              <input id="pb-filter" placeholder="Filter stories" autocomplete="off" spellcheck="false">
              <span class="clear" id="pb-filter-clear" style="display:none">×</span>
            </label>
          </div>
          <div class="sb-tree" id="pb-tree"></div>
        </aside>
        <section class="canvas" id="pb-canvas"></section>
        <aside class="inspector" id="pb-inspector"></aside>
      </div>`;

    treeEl = document.getElementById("pb-tree");
    canvasEl = document.getElementById("pb-canvas");
    inspectorEl = document.getElementById("pb-inspector");
    searchInput = document.getElementById("pb-filter");

    updateThemeButton();
    document.getElementById("pb-theme").addEventListener("click", toggleTheme);
    document.getElementById("pb-cmdk").addEventListener("click", openCommandPalette);

    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      document.getElementById("pb-filter-clear").style.display = state.query
        ? "block"
        : "none";
      renderSidebar();
    });
    document.getElementById("pb-filter-clear").addEventListener("click", () => {
      searchInput.value = "";
      state.query = "";
      document.getElementById("pb-filter-clear").style.display = "none";
      renderSidebar();
      searchInput.focus();
    });

    treeEl.addEventListener("click", onTreeClick);
  }

  // ───────── sidebar ─────────
  function onTreeClick(e) {
    const sel = e.target.closest("[data-select]");
    if (sel) return selectKey(sel.getAttribute("data-select"), true);
    const tog = e.target.closest("[data-toggle]");
    if (tog) {
      const k = tog.getAttribute("data-toggle");
      state.collapsed[k] = !state.collapsed[k];
      renderSidebar();
    }
  }

  function renderSidebar() {
    if (!treeEl) return;
    const q = state.query.trim().toLowerCase();
    const html = buildTree(state.manifest.tree || [], [], 0, q);
    treeEl.innerHTML = html || '<div class="sb-empty">No matches</div>';
  }

  function buildTree(nodes, trail, depth, q) {
    let html = "";
    for (const node of nodes) {
      if (node.type === "group") {
        const t2 = trail.concat([node.name]);
        const inner = buildTree(node.children || [], t2, depth + 1, q);
        if (!inner) continue;
        const key = "g:" + t2.join("/");
        const collapsed = !!state.collapsed[key];
        const indent = 8 + depth * 12;
        if (depth === 0) {
          html += `<div class="sb-group-h ${collapsed ? "is-collapsed" : ""}" data-toggle="${esc(key)}" style="padding-left:${indent}px">
            <span class="chev">${I.chev}</span>${esc(node.name)}</div>`;
        } else {
          html += `<div class="sb-item ${collapsed ? "is-collapsed" : ""}" data-toggle="${esc(key)}" style="padding-left:${indent}px">
            <span class="chev">${I.chev}</span><span class="gicon">${I.folder}</span><span class="label">${esc(node.name)}</span></div>`;
        }
        if (!collapsed) html += inner;
      } else if (node.type === "component") {
        const t2 = trail.concat([node.name]);
        const compMatch = !q || node.name.toLowerCase().includes(q);
        const stories = (node.stories || []).filter(
          (s) => !q || compMatch || s.name.toLowerCase().includes(q),
        );
        if (q && !compMatch && stories.length === 0) continue;
        if (stories.length === 0 && !compMatch) continue;

        const key = "c:" + t2.join("/");
        const collapsed = !!state.collapsed[key];
        const hasSelected = stories.some(
          (s) => keyOf(t2.concat([s.name])) === state.selectedKey,
        );
        const showStories = !collapsed || hasSelected;
        const indent = 8 + depth * 12;
        html += `<div class="sb-item is-component ${collapsed && !hasSelected ? "is-collapsed" : ""}" data-toggle="${esc(key)}" style="padding-left:${indent}px">
          <span class="chev">${I.chev}</span><span class="gicon">${I.comp}</span><span class="label">${esc(node.name)}</span><span class="count">${stories.length}</span></div>`;
        if (showStories) {
          const sIndent = 28 + depth * 12;
          for (const s of stories) {
            const rk = keyOf(t2.concat([s.name]));
            const selected = rk === state.selectedKey;
            html += `<div class="sb-story ${selected ? "is-selected" : ""}" data-select="${esc(rk)}" style="padding-left:${sIndent}px">
              <span class="dot"></span><span class="label">${esc(s.name)}</span></div>`;
          }
        }
      }
    }
    return html;
  }

  function scrollSelectedIntoView() {
    const node = treeEl && treeEl.querySelector(".sb-story.is-selected");
    if (node && node.scrollIntoView) node.scrollIntoView({ block: "nearest" });
  }

  // ───────── canvas ─────────
  function renderCanvas() {
    if (!canvasEl) return;
    const story = currentStory();
    if (!story) {
      canvasEl.innerHTML =
        '<div class="canvas-body"><div class="snap-missing">No previews to display.</div></div>';
      return;
    }
    const idx = state.stories.findIndex((s) => s.routeKey === state.selectedKey);

    canvasEl.innerHTML = `
      <div class="canvas-head">
        <div class="crumb">
          <span>${esc(story.component)}</span>
          <span class="sep">/</span>
          <span class="last">${esc(story.name)}</span>
          <span class="crumb-tag" id="pb-size">—</span>
        </div>
        <button class="tbtn" id="pb-expand" title="Open lightbox">${I.expand}</button>
        <a class="tbtn" id="pb-download" title="Download PNG" href="${esc(story.asset)}" download>${I.download}</a>
      </div>
      <div class="canvas-body">
        <div class="snap-card">
          <div class="snap-frame" id="pb-frame" style="transform:scale(${state.zoom})">
            <img id="pb-img" alt="${esc(story.component + " / " + story.name)}" src="${esc(story.asset)}">
          </div>
          <div class="snap-label" id="pb-snaplabel">${esc(baseName(story.asset))}</div>
        </div>
      </div>
      <div class="canvas-foot">
        <div class="nav-group">
          <button class="tbtn" id="pb-prev" title="Previous story">${I.prev}</button>
          <span class="nav-label">${pad(idx + 1)} / ${pad(state.stories.length)}</span>
          <button class="tbtn" id="pb-next" title="Next story">${I.next}</button>
        </div>
        <div class="spacer"></div>
        <div class="zoom-group">
          <button class="tbtn" id="pb-zoomout" title="Zoom out">${I.zoomOut}</button>
          <span class="zoom-val" id="pb-zoomval">${Math.round(state.zoom * 100)}%</span>
          <button class="tbtn" id="pb-zoomin" title="Zoom in">${I.zoomIn}</button>
          <button class="tbtn" id="pb-fit" title="Reset zoom">${I.fit}</button>
        </div>
      </div>`;

    const img = document.getElementById("pb-img");
    img.addEventListener("load", () => updateSizeLabels(img, story));
    img.addEventListener("error", () => {
      const frame = document.getElementById("pb-frame");
      if (frame)
        frame.innerHTML =
          '<div class="snap-missing">Snapshot not found\n' + esc(story.asset) + "</div>";
    });
    img.addEventListener("click", openLightbox);
    document.getElementById("pb-expand").addEventListener("click", openLightbox);
    document.getElementById("pb-prev").addEventListener("click", () => navTo(-1));
    document.getElementById("pb-next").addEventListener("click", () => navTo(+1));
    document.getElementById("pb-zoomout").addEventListener("click", () => setZoom(state.zoom - 0.1));
    document.getElementById("pb-zoomin").addEventListener("click", () => setZoom(state.zoom + 0.1));
    document.getElementById("pb-fit").addEventListener("click", () => setZoom(1));
  }

  function setZoom(z) {
    state.zoom = +clamp(z, 0.25, 3).toFixed(2);
    const frame = document.getElementById("pb-frame");
    const val = document.getElementById("pb-zoomval");
    if (frame) frame.style.transform = "scale(" + state.zoom + ")";
    if (val) val.textContent = Math.round(state.zoom * 100) + "%";
  }

  function updateSizeLabels(img, story) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    const size = w + "×" + h;
    const sizeEl = document.getElementById("pb-size");
    const labelEl = document.getElementById("pb-snaplabel");
    if (sizeEl) sizeEl.textContent = size;
    if (labelEl) labelEl.textContent = baseName(story.asset) + " · " + size;
  }

  // ───────── inspector ─────────
  function renderInspector() {
    if (!inspectorEl) return;
    const story = currentStory();
    if (!story) {
      inspectorEl.innerHTML =
        '<div class="insp-body"><div class="insp-section"><p class="meta-key">No selection.</p></div></div>';
      return;
    }

    inspectorEl.innerHTML = `
      <div class="insp-tabs">
        <button class="insp-tab ${state.tab === "source" ? "is-active" : ""}" data-tab="source">Source</button>
        <button class="insp-tab ${state.tab === "info" ? "is-active" : ""}" data-tab="info">Info</button>
      </div>
      <div class="insp-body">${state.tab === "source" ? sourceTab(story) : infoTab(story)}</div>`;

    for (const tab of inspectorEl.querySelectorAll(".insp-tab")) {
      tab.addEventListener("click", () => {
        state.tab = tab.getAttribute("data-tab");
        renderInspector();
      });
    }
    const copyBtn = inspectorEl.querySelector("#pb-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        if (navigator.clipboard) navigator.clipboard.writeText(story.source || "");
        const label = copyBtn.querySelector("span");
        if (label) {
          label.textContent = "Copied";
          setTimeout(() => (label.textContent = "Copy"), 1200);
        }
      });
    }
  }

  function sourceTab(story) {
    const startLn = story.line || 1;
    const lines = (story.source || "").split("\n");
    const code = lines
      .map(
        (ln, i) =>
          '<div><span class="ln">' + (startLn + i) + "</span>" + highlight(ln) + "</div>",
      )
      .join("");
    const kindLabel = story.kind === "provider" ? "PreviewProvider" : "#Preview";
    return `
      <div class="code-head">
        <span class="file">${esc(baseName(story.file))}<span class="line">:L${startLn}</span></span>
        <button class="code-copy" id="pb-copy">${I.copy}<span>Copy</span></button>
      </div>
      <pre class="code-block">${code}</pre>
      <div class="insp-section">
        <div class="insp-section-h">Story</div>
        ${metaRow("Name", esc(story.name), true)}
        ${metaRow("Component", esc(story.component))}
        ${story.targetType ? metaRow("Type", esc(story.targetType)) : ""}
        ${metaRow("Kind", '<span class="pill">' + esc(kindLabel) + "</span>", true)}
      </div>`;
  }

  function infoTab(story) {
    const lines =
      story.line && story.endLine ? "L" + story.line + "–L" + story.endLine : "—";
    const shareHash = "#/" + story.routeKey;
    const mcp =
      "RenderPreview(\n" +
      '  sourceFilePath: "' + story.file + '",\n' +
      "  previewDefinitionIndexInFile: " + story.index + "\n" +
      ")";
    return `
      <div class="insp-section">
        <div class="insp-section-h">Source</div>
        ${metaRow("File", esc(story.file))}
        ${metaRow("Lines", esc(lines))}
        ${metaRow("Preview #", String(story.index))}
      </div>
      <div class="insp-section">
        <div class="insp-section-h">Render</div>
        ${metaRow("Type", esc(story.targetType || "—"), true)}
        ${metaRow("Asset", esc(story.asset))}
      </div>
      <div class="insp-section">
        <div class="insp-section-h">MCP Call</div>
        <pre class="code-block" style="border:0;padding:12px;font-size:11px">${highlight(mcp)}</pre>
      </div>
      <div class="insp-section">
        <div class="insp-section-h">Story ID</div>
        <div class="meta-row" style="grid-template-columns:1fr"><span class="meta-val" style="font-size:11px">${esc(story.id)}</span></div>
        <div style="color:var(--fg-faint);font-size:11px;margin-top:6px">Share via <span style="font-family:var(--font-mono);color:var(--fg-subtle)">${esc(shareHash)}</span></div>
      </div>`;
  }

  function metaRow(key, valHtml, sans) {
    return (
      '<div class="meta-row"><span class="meta-key">' +
      esc(key) +
      '</span><span class="meta-val' +
      (sans ? " sans" : "") +
      '">' +
      valHtml +
      "</span></div>"
    );
  }

  // very small Swift-ish tokenizer → safe HTML
  function highlight(src) {
    const patterns = [
      [/\/\/[^\n]*/g, "com"],
      [/"(?:\\.|[^"\\])*"/g, "str"],
      [/\b(struct|class|enum|var|let|func|return|if|else|true|false|nil|self|in|case|switch|some|import|preferredColorScheme|environment|disabled)\b/g, "key"],
      [/#Preview/g, "fn"],
      [/\b([A-Z]\w*)\b/g, "typ"],
      [/\b\d+(\.\d+)?\b/g, "num"],
    ];
    const matches = [];
    for (const [re, cls] of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src)) !== null) {
        if (m[0] === "") {
          re.lastIndex++;
          continue;
        }
        matches.push({ start: m.index, end: m.index + m[0].length, cls, txt: m[0] });
      }
    }
    matches.sort((a, b) => a.start - b.start || b.end - a.end);
    const cleaned = [];
    let last = -1;
    for (const m of matches) {
      if (m.start >= last) {
        cleaned.push(m);
        last = m.end;
      }
    }
    let out = "";
    let pos = 0;
    for (const m of cleaned) {
      if (m.start > pos) out += esc(src.slice(pos, m.start));
      out += '<span class="tok-' + m.cls + '">' + esc(m.txt) + "</span>";
      pos = m.end;
    }
    if (pos < src.length) out += esc(src.slice(pos));
    return out;
  }

  // ───────── lightbox ─────────
  function openLightbox() {
    const story = currentStory();
    if (!story) return;
    closeLightbox();
    const overlay = document.createElement("div");
    overlay.className = "lb-overlay";
    overlay.id = "pb-lightbox";
    overlay.innerHTML = `
      <div class="lb-meta">
        <b>${esc(story.component)}</b>
        <span style="color:var(--fg-faint)">·</span>
        <span>${esc(story.name)}</span>
      </div>
      <button class="lb-close" title="Close">${I.close}</button>
      <img alt="${esc(story.component + " / " + story.name)}" src="${esc(story.asset)}">`;
    overlay.addEventListener("click", (e) => {
      if (e.target.closest(".lb-meta")) return;
      closeLightbox();
    });
    document.body.appendChild(overlay);
  }
  function closeLightbox() {
    const lb = document.getElementById("pb-lightbox");
    if (lb) lb.remove();
  }
  const lightboxOpen = () => !!document.getElementById("pb-lightbox");

  // ───────── command palette ─────────
  function openCommandPalette() {
    if (state.showCP) return;
    state.showCP = true;
    const overlay = document.createElement("div");
    overlay.className = "cp-overlay";
    overlay.id = "pb-cp";
    overlay.innerHTML = `
      <div class="cp-panel">
        <div class="cp-input">
          ${I.search}
          <input id="pb-cp-input" placeholder="Search components, stories, files…" autocomplete="off" spellcheck="false">
          <span class="kbd">ESC</span>
        </div>
        <div class="cp-list" id="pb-cp-list"></div>
        <div class="cp-foot">
          <span class="key"><span class="kbd">↑↓</span> navigate</span>
          <span class="key"><span class="kbd">↵</span> open</span>
          <span class="key"><span class="kbd">ESC</span> close</span>
          <span style="margin-left:auto" id="pb-cp-count"></span>
        </div>
      </div>`;
    overlay.addEventListener("click", (e) => {
      if (!e.target.closest(".cp-panel")) closeCommandPalette();
    });
    document.body.appendChild(overlay);

    const cp = { query: "", idx: 0, results: [] };
    overlay._cp = cp;
    const input = document.getElementById("pb-cp-input");
    input.addEventListener("input", () => {
      cp.query = input.value;
      cp.idx = 0;
      renderCPList(cp);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        cp.idx = Math.min(cp.results.length - 1, cp.idx + 1);
        renderCPList(cp);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        cp.idx = Math.max(0, cp.idx - 1);
        renderCPList(cp);
      } else if (e.key === "Enter") {
        const s = cp.results[cp.idx];
        if (s) {
          selectKey(s.routeKey, true);
          closeCommandPalette();
        }
      }
    });
    renderCPList(cp);
    input.focus();
  }

  function renderCPList(cp) {
    const q = cp.query.trim().toLowerCase();
    cp.results = !q
      ? state.stories.slice(0, 12)
      : state.stories
          .filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.component.toLowerCase().includes(q) ||
              (s.file || "").toLowerCase().includes(q),
          )
          .slice(0, 20);

    const list = document.getElementById("pb-cp-list");
    const count = document.getElementById("pb-cp-count");
    if (!list) return;
    if (cp.results.length === 0) {
      list.innerHTML = '<div class="cp-empty">No matches for "' + esc(cp.query) + '"</div>';
    } else {
      list.innerHTML = cp.results
        .map((s, i) => {
          const path = (s.file || "").split("/").slice(-2).join("/");
          return `<div class="cp-item ${i === cp.idx ? "is-active" : ""}" data-key="${esc(s.routeKey)}">
            <span class="gicon">${I.comp}</span>
            <span class="cp-name"><b>${esc(s.component)}</b><span class="sep">·</span>${esc(s.name)}</span>
            <span class="cp-path">${esc(path)}</span></div>`;
        })
        .join("");
      for (const item of list.querySelectorAll(".cp-item")) {
        item.addEventListener("click", () => {
          selectKey(item.getAttribute("data-key"), true);
          closeCommandPalette();
        });
        item.addEventListener("mouseenter", () => {
          cp.idx = cp.results.findIndex(
            (s) => s.routeKey === item.getAttribute("data-key"),
          );
          for (const el of list.querySelectorAll(".cp-item"))
            el.classList.toggle("is-active", el === item);
        });
      }
    }
    if (count) count.textContent = cp.results.length + " of " + state.stories.length;
  }

  function closeCommandPalette() {
    state.showCP = false;
    const cp = document.getElementById("pb-cp");
    if (cp) cp.remove();
  }

  // ───────── global keys / theme ─────────
  function onGlobalKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (state.showCP) closeCommandPalette();
      else openCommandPalette();
      return;
    }
    if (e.key === "Escape") {
      if (lightboxOpen()) return closeLightbox();
      if (state.showCP) return closeCommandPalette();
    }
    if (lightboxOpen()) {
      if (e.key === "ArrowLeft") navTo(-1), refreshLightbox();
      else if (e.key === "ArrowRight") navTo(+1), refreshLightbox();
    }
  }

  function refreshLightbox() {
    if (lightboxOpen()) openLightbox();
  }

  function initTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem("pb-theme");
    } catch (e) {}
    if (!stored) {
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      stored = prefersDark ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", stored);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("pb-theme", next);
    } catch (e) {}
    updateThemeButton();
  }
  function updateThemeButton() {
    const btn = document.getElementById("pb-theme");
    if (!btn) return;
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.innerHTML = dark ? I.sun : I.moon;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/**
 * ============================================================================
 *  PLACEHOLDER DESIGN
 * ============================================================================
 *  This is a deliberately neutral, functional UI shell. The final visual design
 *  is being produced separately by a designer and will be dropped in later.
 *
 *  Everything visual lives in this one module on purpose:
 *    - PLACEHOLDER_CSS  : all styling (swap wholesale for the real design)
 *    - APP_JS           : the SPA behaviour (tree, canvas, details, routing)
 *
 *  The data contract the UI relies on (the `stories.json` / manifest shape and
 *  the `window.__PREVIEWBOOK_MANIFEST__` injection point) is stable, so the CSS
 *  and DOM structure can be replaced without touching the rest of the tool.
 *
 *  NOTE: APP_JS intentionally avoids template literals so it can be embedded in
 *  a TypeScript template string without escaping.
 * ============================================================================
 */

export const PLACEHOLDER_CSS = `
/* ---- PLACEHOLDER theme tokens ---- */
:root {
  --bg: #ffffff;
  --bg-elevated: #f5f6f8;
  --bg-sunken: #eceef1;
  --border: #d9dde3;
  --text: #1c2024;
  --text-muted: #6b7280;
  --accent: #3b6fe0;
  --accent-contrast: #ffffff;
  --canvas-bg: #f0f2f5;
  --code-bg: #f5f6f8;
  --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}
:root[data-theme="dark"] {
  --bg: #15171a;
  --bg-elevated: #1c1f24;
  --bg-sunken: #101215;
  --border: #2c3037;
  --text: #e6e8eb;
  --text-muted: #9aa1ab;
  --accent: #5b8bff;
  --accent-contrast: #0b0c0e;
  --canvas-bg: #0f1114;
  --code-bg: #1c1f24;
}

* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: var(--font-ui);
  color: var(--text);
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

/* ---- Header ---- */
header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elevated);
  flex: 0 0 auto;
}
header .brand { font-weight: 600; font-size: 15px; }
header .badge {
  font-size: 10px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--accent-contrast);
  background: var(--accent);
  border-radius: 999px;
  padding: 2px 8px;
}
header .spacer { flex: 1 1 auto; }
header input.search {
  width: 240px;
  max-width: 36vw;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
}
header button {
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
}
header button:hover { background: var(--bg-sunken); }

/* ---- 3-pane layout ---- */
main {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  min-height: 0;
}
aside, section { overflow: auto; min-height: 0; }
.sidebar { border-right: 1px solid var(--border); padding: 8px 6px; }
.details { border-left: 1px solid var(--border); padding: 16px; }
.canvas {
  background: var(--canvas-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ---- Sidebar tree ---- */
.tree, .tree ul { list-style: none; margin: 0; padding: 0; }
.tree ul { margin-left: 12px; }
.tree li { user-select: none; }
.tree .row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.tree .row:hover { background: var(--bg-sunken); }
.tree .group > .row { color: var(--text); font-weight: 500; }
.tree .component > .row { color: var(--text); }
.tree .story > .row { color: var(--text-muted); }
.tree .story.active > .row {
  background: var(--accent);
  color: var(--accent-contrast);
}
.tree .twisty {
  width: 12px;
  display: inline-block;
  text-align: center;
  color: var(--text-muted);
  transition: transform .1s ease;
}
.tree li.collapsed > ul { display: none; }
.tree li.collapsed > .row .twisty { transform: rotate(-90deg); }
.tree .leaf-dot { color: var(--text-muted); }

/* ---- Canvas ---- */
.snapshot {
  max-width: 100%;
  max-height: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,.12);
  cursor: zoom-in;
}
.canvas .toolbar {
  position: absolute;
  bottom: 16px;
  display: flex;
  gap: 8px;
}
.canvas-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.empty { color: var(--text-muted); font-size: 14px; text-align: center; }

/* ---- Details ---- */
.details h2 { font-size: 14px; margin: 0 0 4px; }
.details .sub { color: var(--text-muted); font-size: 12px; margin: 0 0 16px; }
.details h3 {
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 20px 0 8px;
}
.details pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}
.meta { font-size: 12px; }
.meta div { display: flex; gap: 8px; padding: 3px 0; }
.meta .k { color: var(--text-muted); min-width: 72px; }
.meta .v { font-family: var(--font-mono); word-break: break-all; }

/* ---- Lightbox ---- */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.8);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 40px;
  cursor: zoom-out;
  z-index: 50;
}
.lightbox.open { display: flex; }
.lightbox img { max-width: 100%; max-height: 100%; border-radius: 8px; }

footer {
  flex: 0 0 auto;
  border-top: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-muted);
  font-size: 11px;
  padding: 6px 16px;
}
`;

export const APP_JS = `
(function () {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var state = { manifest: null, stories: [], byKey: {}, currentKey: null };

  function boot() {
    initTheme();
    bindChrome();
    var embedded = window.__PREVIEWBOOK_MANIFEST__;
    if (embedded) { init(embedded); return; }
    fetch('stories.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(init)
      .catch(function (err) {
        canvasMessage('Failed to load stories.json: ' + esc(err.message));
      });
  }

  function init(manifest) {
    state.manifest = manifest;
    var title = manifest.title || 'Preview Book';
    document.getElementById('title').textContent = title;
    document.title = title;
    var foot = document.getElementById('generated');
    if (manifest.generatedAt) foot.textContent = 'Generated ' + manifest.generatedAt;

    state.stories = flatten(manifest.tree || []);
    state.byKey = {};
    for (var i = 0; i < state.stories.length; i++) {
      state.byKey[state.stories[i].key] = state.stories[i];
    }
    renderSidebar('');
    window.addEventListener('hashchange', routeFromHash);
    routeFromHash();
  }

  // ---- Flattening / routing ----

  function flatten(tree) {
    var out = [];
    walk(tree, [], out);
    return out;
  }
  function walk(nodes, trail, out) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.type === 'group') {
        walk(node.children || [], trail.concat([node.name]), out);
      } else if (node.type === 'component') {
        var compTrail = trail.concat([node.name]);
        var stories = node.stories || [];
        for (var j = 0; j < stories.length; j++) {
          var story = stories[j];
          var route = compTrail.concat([story.name]);
          out.push({
            route: route,
            key: route.map(encodeURIComponent).join('/'),
            story: story,
            component: node.name
          });
        }
      }
    }
  }

  function routeFromHash() {
    var hash = location.hash.replace(/^#\\/?/, '');
    var entry = state.byKey[hash];
    if (!entry && state.stories.length) entry = state.stories[0];
    if (entry) select(entry.key, false);
  }

  function select(key, updateHash) {
    var entry = state.byKey[key];
    if (!entry) return;
    state.currentKey = key;
    if (updateHash !== false && location.hash !== '#/' + key) {
      location.hash = '#/' + key;
    }
    renderCanvas(entry);
    renderDetails(entry);
    markActive(key);
  }

  // ---- Sidebar ----

  function renderSidebar(filter) {
    var root = document.getElementById('tree');
    root.innerHTML = '';
    var ul = document.createElement('ul');
    ul.className = 'tree';
    buildNodes(state.manifest.tree || [], [], ul, (filter || '').toLowerCase());
    root.appendChild(ul);
    markActive(state.currentKey);
  }

  function buildNodes(nodes, trail, parentUl, filter) {
    var any = false;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.type === 'group') {
        var li = makeBranch('group', node.name, '📁');
        var childUl = li.querySelector('ul');
        var has = buildNodes(node.children || [], trail.concat([node.name]), childUl, filter);
        if (has) { parentUl.appendChild(li); any = true; }
      } else if (node.type === 'component') {
        var compTrail = trail.concat([node.name]);
        var cli = makeBranch('component', node.name, '🧩');
        var cul = cli.querySelector('ul');
        var matched = 0;
        var stories = node.stories || [];
        for (var j = 0; j < stories.length; j++) {
          var story = stories[j];
          var route = compTrail.concat([story.name]);
          var key = route.map(encodeURIComponent).join('/');
          if (filter && !matchesFilter(node.name, story.name, filter)) continue;
          cul.appendChild(makeLeaf(story.name, key));
          matched++;
        }
        if (matched > 0) { parentUl.appendChild(cli); any = true; }
      }
    }
    return any;
  }

  function matchesFilter(component, story, filter) {
    return (component + ' ' + story).toLowerCase().indexOf(filter) >= 0;
  }

  function makeBranch(kind, name, icon) {
    var li = document.createElement('li');
    li.className = kind;
    var row = document.createElement('div');
    row.className = 'row';
    var tw = document.createElement('span');
    tw.className = 'twisty';
    tw.textContent = '▾';
    var label = document.createElement('span');
    label.textContent = icon + ' ' + name;
    row.appendChild(tw);
    row.appendChild(label);
    row.addEventListener('click', function () { li.classList.toggle('collapsed'); });
    var ul = document.createElement('ul');
    li.appendChild(row);
    li.appendChild(ul);
    return li;
  }

  function makeLeaf(name, key) {
    var li = document.createElement('li');
    li.className = 'story';
    li.setAttribute('data-key', key);
    var row = document.createElement('div');
    row.className = 'row';
    var dot = document.createElement('span');
    dot.className = 'leaf-dot';
    dot.textContent = '•';
    var label = document.createElement('span');
    label.textContent = name;
    row.appendChild(dot);
    row.appendChild(label);
    row.addEventListener('click', function () { select(key, true); });
    li.appendChild(row);
    return li;
  }

  function markActive(key) {
    var all = document.querySelectorAll('.tree .story');
    for (var i = 0; i < all.length; i++) {
      var li = all[i];
      if (li.getAttribute('data-key') === key) {
        li.classList.add('active');
        expandAncestors(li);
      } else {
        li.classList.remove('active');
      }
    }
  }

  function expandAncestors(li) {
    var p = li.parentNode;
    while (p && p !== document.body) {
      if (p.classList && p.classList.contains('collapsed')) p.classList.remove('collapsed');
      p = p.parentNode;
    }
  }

  // ---- Canvas ----

  function renderCanvas(entry) {
    var canvas = document.getElementById('canvas');
    canvas.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'canvas-wrap';

    var img = document.createElement('img');
    img.className = 'snapshot';
    img.alt = entry.component + ' / ' + entry.story.name;
    img.src = entry.story.asset;
    img.addEventListener('click', function () { openLightbox(entry.story.asset); });
    img.addEventListener('error', function () {
      canvasMessage('Snapshot not found: ' + esc(entry.story.asset));
    });
    wrap.appendChild(img);

    var toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    var zoom = document.createElement('button');
    zoom.textContent = 'Zoom';
    zoom.addEventListener('click', function () { openLightbox(entry.story.asset); });
    var dl = document.createElement('a');
    dl.textContent = 'Download';
    dl.href = entry.story.asset;
    dl.setAttribute('download', '');
    dl.className = 'dl';
    toolbar.appendChild(zoom);
    toolbar.appendChild(dl);
    wrap.appendChild(toolbar);

    canvas.appendChild(wrap);
  }

  function canvasMessage(html) {
    var canvas = document.getElementById('canvas');
    canvas.innerHTML = '<div class="empty">' + html + '</div>';
  }

  // ---- Details ----

  function renderDetails(entry) {
    var s = entry.story;
    var d = document.getElementById('details');
    var rows = '';
    rows += metaRow('File', s.file);
    rows += metaRow('Index', String(s.index));
    if (s.targetType) rows += metaRow('Type', s.targetType);
    rows += metaRow('Component', entry.component);
    rows += metaRow('Story ID', s.id);

    d.innerHTML =
      '<h2>' + esc(s.name) + '</h2>' +
      '<p class="sub">' + esc(entry.component) + '</p>' +
      '<h3>Source</h3>' +
      '<pre><code>' + esc(s.source || '') + '</code></pre>' +
      '<h3>Metadata</h3>' +
      '<div class="meta">' + rows + '</div>';
  }

  function metaRow(k, v) {
    return '<div><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span></div>';
  }

  // ---- Lightbox ----

  function openLightbox(src) {
    var lb = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    lb.classList.add('open');
  }
  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
  }

  // ---- Chrome (search, theme, lightbox bindings) ----

  function bindChrome() {
    var search = document.getElementById('search');
    search.addEventListener('input', function () { renderSidebar(search.value); });

    document.getElementById('theme').addEventListener('click', toggleTheme);

    var lb = document.getElementById('lightbox');
    lb.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem('previewbook-theme'); } catch (e) {}
    if (!stored) {
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      stored = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', stored);
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('previewbook-theme', next); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`;

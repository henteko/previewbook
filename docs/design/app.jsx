// app.jsx — root app
const { useState, useEffect, useMemo, useCallback } = React;

function App() {
  const { STORIES, TREE, generatedAt } = window.PreviewbookData;

  const idFromHash = () => {
    const h = decodeURIComponent(location.hash || "").slice(2); // strip "#/"
    if (!h) return null;
    const parts = h.split("/").filter(Boolean);
    if (parts.length < 3) return null;
    const [group, comp, name] = parts;
    return STORIES.find(
      (s) => s.file.split("/")[1] === group && s.component === comp && s.name.replace(/\s/g, "-") === name
    )?.id || null;
  };

  const [selectedId, setSelectedId] = useState(() => idFromHash() || STORIES[0].id);
  const [theme, setTheme] = useState(() => localStorage.getItem("pb-theme") || "light");
  const [showLB, setShowLB] = useState(false);
  const [showCP, setShowCP] = useState(false);
  const [pinned, setPinned] = useState(new Set());

  const story = STORIES.find((s) => s.id === selectedId) || STORIES[0];
  const totalIndex = STORIES.findIndex((s) => s.id === selectedId);

  // Update hash
  useEffect(() => {
    const group = story.file.split("/")[1];
    location.hash = `#/${group}/${story.component}/${story.name.replace(/\s/g, "-")}`;
  }, [story.id]);

  // Hash → state
  useEffect(() => {
    const onHash = () => {
      const id = idFromHash();
      if (id && id !== selectedId) setSelectedId(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [selectedId]);

  // Cmd-K
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCP((v) => !v);
      } else if (e.key === "Escape") {
        setShowCP(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Story navigation
  const navTo = useCallback((delta) => {
    const i = STORIES.findIndex((s) => s.id === selectedId);
    const ni = (i + delta + STORIES.length) % STORIES.length;
    setSelectedId(STORIES[ni].id);
  }, [selectedId]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pb-theme", theme);
  }, [theme]);

  const switchTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const togglePin = () => {
    setPinned((p) => {
      const n = new Set(p);
      if (n.has(story.id)) n.delete(story.id); else n.add(story.id);
      return n;
    });
  };

  return (
    <div className="app">
      <PBTopBar
        theme={theme}
        onTheme={switchTheme}
        onCmdK={() => setShowCP(true)}
        generatedAt={generatedAt}
      />
      <PBSidebar
        tree={TREE}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <PBCanvas
        story={story}
        onPrev={() => navTo(-1)}
        onNext={() => navTo(+1)}
        onOpenLightbox={() => setShowLB(true)}
        totalIndex={totalIndex}
        totalCount={STORIES.length}
      />
      <PBInspector story={story} pinned={pinned.has(story.id)} onTogglePin={togglePin} />

      {showLB && (
        <PBLightbox
          story={story}
          onClose={() => setShowLB(false)}
          onPrev={() => navTo(-1)}
          onNext={() => navTo(+1)}
        />
      )}
      {showCP && (
        <PBCommandPalette
          stories={STORIES}
          onPick={(id) => setSelectedId(id)}
          onClose={() => setShowCP(false)}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

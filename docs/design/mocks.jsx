// mocks.jsx — iOS UI mock previews for each Story.
// These simulate the rendered SwiftUI snapshots.

const StatusBar = () => (
  <div className="ios-status">
    <span>9:41</span>
    <span className="ios-status-r">
      <span className="ios-status-bars"><i></i><i></i><i></i><i></i></span>
      <span style={{ fontSize: 11, fontWeight: 600 }}>5G</span>
      <span className="ios-battery"><i></i></span>
    </span>
  </div>
);

const HomeIndicator = () => <div className="ios-home"></div>;

const Icon = ({ name, color, ...p }) => {
  // tiny inline mono-line SVG icons used inside iOS rows
  const paths = {
    bell: "M12 2a6 6 0 0 0-6 6v3.5L4 14h16l-2-2.5V8a6 6 0 0 0-6-6Zm0 20a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Z",
    star: "m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27Z",
    folder: "M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z",
    inbox: "M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-6l-2 2h-4l-2-2H3Zm2-2 4-7h6l4 7H5Z",
    check: "M5 12l4 4 10-10",
    plus: "M12 5v14M5 12h14",
    search: "M11 19a8 8 0 1 1 5.3-2L21 21l-1.5 1.5L15 17.8A8 8 0 0 1 11 19Zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
    cog: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4a1 1 0 0 0-.5-.9l-1.7-.7a7 7 0 0 0-.6-1.5l.6-1.7a1 1 0 0 0-.2-1l-1.4-1.4a1 1 0 0 0-1-.2l-1.7.6a7 7 0 0 0-1.5-.6l-.7-1.7A1 1 0 0 0 12 2a1 1 0 0 0-.9.5l-.7 1.7a7 7 0 0 0-1.5.6l-1.7-.6a1 1 0 0 0-1 .2L4.8 5.8a1 1 0 0 0-.2 1l.6 1.7a7 7 0 0 0-.6 1.5l-1.7.7a1 1 0 0 0-.5.9c0 .4.2.7.5.9l1.7.7a7 7 0 0 0 .6 1.5l-.6 1.7a1 1 0 0 0 .2 1l1.4 1.4a1 1 0 0 0 1 .2l1.7-.6a7 7 0 0 0 1.5.6l.7 1.7c.2.3.5.5.9.5a1 1 0 0 0 .9-.5l.7-1.7a7 7 0 0 0 1.5-.6l1.7.6a1 1 0 0 0 1-.2l1.4-1.4a1 1 0 0 0 .2-1l-.6-1.7a7 7 0 0 0 .6-1.5l1.7-.7c.3-.2.5-.5.5-.9Z",
    house: "M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9Z",
    list: "M4 6h16M4 12h16M4 18h16",
    chart: "M4 20h16M6 16v-6M10 16V8M14 16v-4M18 16V6",
    person: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM3 22a9 9 0 0 1 18 0",
    cloud: "M7 18a4 4 0 1 1 .5-7.97A6 6 0 0 1 19 12a4 4 0 0 1 0 8H7Z",
    lock: "M6 10V8a6 6 0 1 1 12 0v2M5 10h14v10H5z",
    moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
    info: "M12 8h.01M11 12h1v5h1M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
    location: "M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    download: "M12 4v12m0 0 4-4m-4 4-4-4M4 20h16",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13",
    play: "M7 5v14l12-7L7 5z",
    photo: "M3 5h18v14H3zm0 11 5-5 4 4 3-3 6 6",
    wifi: "M2 9a16 16 0 0 1 20 0M5 13a11 11 0 0 1 14 0M8 17a6 6 0 0 1 8 0M12 21h.01",
    plane: "M21 12 12 16l-4 4-2-2 3-5-7-3 1-2 8 1 4-5 2 1-2 5 5 1-1 1Z",
    book: "M4 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H4V4Zm16 0h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7V4Z",
    badge: "M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d={paths[name] || ""} />
    </svg>
  );
};

const Row = ({ tint, icon, title, detail, toggle, chev = true, danger = false }) => (
  <div className="ios-row">
    {icon && (
      <span className="ios-row-icon" style={{ background: tint || "#8e8e93" }}>
        <Icon name={icon} style={{ width: 16, height: 16 }} color="#fff" />
      </span>
    )}
    <span className="ios-row-title" style={{ color: danger ? "#FF3B30" : "inherit" }}>{title}</span>
    {detail !== undefined && <span className="ios-row-detail">{detail}</span>}
    {toggle !== undefined && <span className={"ios-toggle" + (toggle ? " on" : "")}></span>}
    {toggle === undefined && chev && !danger && <span className="ios-row-chev">›</span>}
  </div>
);

const TabBar = ({ active = 0 }) => {
  const tabs = [
    { name: "Home", icon: "house" },
    { name: "Explore", icon: "search" },
    { name: "Activity", icon: "chart" },
    { name: "Profile", icon: "person" },
  ];
  return (
    <div className="ios-tab-bar">
      {tabs.map((t, i) => (
        <div key={t.name} className={"ios-tab" + (i === active ? " active" : "")}>
          <Icon name={t.icon} className="icon" />
          <span>{t.name}</span>
        </div>
      ))}
      <HomeIndicator />
    </div>
  );
};

// ────────── ContentView ──────────
const ContentView_Default = (p) => (
  <div className="ios" {...p}>
    <StatusBar />
    <div className="ios-nav">
      <div className="ios-nav-title">Inbox</div>
      <div className="ios-nav-trail"><Icon name="plus" style={{ width: 22, height: 22 }} /></div>
    </div>
    <div className="ios-search"><Icon name="search" style={{ width: 14, height: 14 }} /> Search</div>
    <div className="ios-list" style={{ marginTop: 4 }}>
      {[
        { tint: "#FF9500", icon: "star", t: "Q2 product strategy", d: "9:42 AM" },
        { tint: "#34C759", icon: "check", t: "Sprint review notes", d: "Yesterday" },
        { tint: "#007AFF", icon: "folder", t: "Design system audit", d: "Tuesday" },
        { tint: "#AF52DE", icon: "book", t: "Reading list — May", d: "Mon" },
        { tint: "#FF3B30", icon: "bell", t: "Vendor renewal", d: "5/14" },
        { tint: "#5AC8FA", icon: "cloud", t: "Backup completed", d: "5/12" },
      ].map((r) => (
        <Row key={r.t} tint={r.tint} icon={r.icon} title={r.t} detail={r.d} />
      ))}
    </div>
    <TabBar active={0} />
  </div>
);

const ContentView_Empty = (p) => (
  <div className="ios" {...p}>
    <StatusBar />
    <div className="ios-nav">
      <div className="ios-nav-title">Inbox</div>
      <div className="ios-nav-trail"><Icon name="plus" style={{ width: 22, height: 22 }} /></div>
    </div>
    <div style={{
      position: "absolute", inset: "120px 20px 90px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 14, textAlign: "center"
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 999,
        background: "var(--ios-bg2)",
        display: "grid", placeItems: "center", color: "var(--ios-tertiary)"
      }}>
        <Icon name="inbox" style={{ width: 28, height: 28 }} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Nothing here yet</div>
      <div style={{ color: "var(--ios-secondary)", fontSize: 14, maxWidth: 220, lineHeight: 1.4 }}>
        New messages and updates will appear in your inbox.
      </div>
      <div className="mk-button tinted" style={{ marginTop: 6 }}>Create something</div>
    </div>
    <TabBar active={0} />
  </div>
);

const ContentView_Loading = (p) => (
  <div className="ios" {...p}>
    <StatusBar />
    <div className="ios-nav">
      <div className="ios-nav-title">Inbox</div>
      <div className="ios-nav-trail"><Icon name="plus" style={{ width: 22, height: 22 }} /></div>
    </div>
    <div className="ios-search">
      <Icon name="search" style={{ width: 14, height: 14 }} /> Search
    </div>
    <div className="ios-list" style={{ marginTop: 4 }}>
      {[0,1,2,3,4,5].map((i) => (
        <div key={i} className="ios-row">
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 11, width: `${50 + (i*7)%40}%`, borderRadius: 4 }}></div>
            <div className="skeleton" style={{ height: 9, width: `${30 + (i*11)%30}%`, marginTop: 6, borderRadius: 4 }}></div>
          </div>
          <div className="skeleton" style={{ width: 28, height: 9, borderRadius: 4 }}></div>
        </div>
      ))}
    </div>
    <TabBar active={0} />
  </div>
);

const ContentView_Error = (p) => (
  <div className="ios" {...p}>
    <StatusBar />
    <div className="ios-nav">
      <div className="ios-nav-title">Inbox</div>
      <div className="ios-nav-trail"><Icon name="plus" style={{ width: 22, height: 22 }} /></div>
    </div>
    <div style={{
      position: "absolute", inset: "120px 20px 90px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 14, textAlign: "center"
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 999,
        background: "rgba(255,59,48,0.12)",
        display: "grid", placeItems: "center", color: "#FF3B30"
      }}>
        <Icon name="wifi" style={{ width: 28, height: 28 }} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Couldn't load inbox</div>
      <div style={{ color: "var(--ios-secondary)", fontSize: 14, maxWidth: 240, lineHeight: 1.4 }}>
        Check your connection and try again. Cached items remain available offline.
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <div className="mk-button ghost">Open offline</div>
        <div className="mk-button primary">Retry</div>
      </div>
    </div>
    <TabBar active={0} />
  </div>
);

// ────────── SettingsView ──────────
const SettingsView_Generic = ({ allOn = false, ...p }) => (
  <div className="ios" {...p} style={{ background: "var(--ios-bg2)" }}>
    <StatusBar />
    <div className="ios-nav">
      <div className="ios-nav-title">Settings</div>
    </div>
    <div className="ios-section-h">General</div>
    <div className="ios-list grouped">
      <Row tint="#007AFF" icon="cloud" title="iCloud Sync" toggle={allOn || true} chev={false} />
      <Row tint="#5AC8FA" icon="wifi" title="Use mobile data" toggle={allOn || false} chev={false} />
      <Row tint="#34C759" icon="bell" title="Notifications" toggle={allOn || true} chev={false} />
    </div>
    <div className="ios-section-h">Appearance</div>
    <div className="ios-list grouped">
      <Row tint="#5856D6" icon="moon" title="Theme" detail="System" />
      <Row tint="#FF9500" icon="star" title="App icon" detail="Default" />
    </div>
    <div className="ios-section-h">Privacy</div>
    <div className="ios-list grouped">
      <Row tint="#8E8E93" icon="lock" title="Lock with Face ID" toggle={allOn || false} chev={false} />
      <Row tint="#FF3B30" icon="trash" title="Delete account" danger chev={false} />
    </div>
    <div style={{ height: 80 }}></div>
  </div>
);

// ────────── ProfileView ──────────
const ProfileView_Generic = ({ name = "Sam Chen", handle = "@samchen", ...p }) => (
  <div className="ios" {...p} style={{ background: "var(--ios-bg2)" }}>
    <StatusBar />
    <div className="ios-nav" style={{ paddingBottom: 4 }}>
      <div className="ios-nav-title" style={{ fontSize: 17, fontWeight: 600 }}>Profile</div>
      <div className="ios-nav-trail">Edit</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 16px 18px", gap: 8 }}>
      <div className="mk-avatar" style={{ background: "linear-gradient(135deg,#5856D6,#007AFF)" }}>
        {name.split(" ").map(n => n[0]).slice(0,2).join("")}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center", padding: "0 8px" }}>{name}</div>
      <div style={{ color: "var(--ios-secondary)", fontSize: 13 }}>{handle}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <div className="mk-button tinted" style={{ height: 32, padding: "0 14px", fontSize: 13, borderRadius: 10 }}>Share</div>
        <div className="mk-button primary" style={{ height: 32, padding: "0 14px", fontSize: 13, borderRadius: 10 }}>Edit</div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", margin: "0 16px 14px", gap: 8 }}>
      {[["Posts","128"],["Followers","2.4k"],["Following","312"]].map(([k,v]) => (
        <div key={k} style={{ background: "var(--ios-cell)", padding: 12, borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{v}</div>
          <div style={{ fontSize: 11, color: "var(--ios-tertiary)", marginTop: 2 }}>{k}</div>
        </div>
      ))}
    </div>
    <div className="ios-list grouped">
      <Row tint="#FF9500" icon="star" title="Saved" detail="42" />
      <Row tint="#34C759" icon="badge" title="Achievements" detail="12" />
      <Row tint="#007AFF" icon="cog" title="Settings" />
    </div>
  </div>
);

const ProfileView_SignedOut = (p) => (
  <div className="ios" {...p} style={{ background: "var(--ios-bg2)" }}>
    <StatusBar />
    <div className="ios-nav">
      <div className="ios-nav-title" style={{ fontSize: 17, fontWeight: 600 }}>Profile</div>
    </div>
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "60px 24px", gap: 14, textAlign: "center"
    }}>
      <div className="mk-avatar" style={{ background: "var(--ios-bg3)", color: "var(--ios-tertiary)" }}>
        <Icon name="person" style={{ width: 32, height: 32 }} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Sign in to continue</div>
      <div style={{ color: "var(--ios-secondary)", fontSize: 14, maxWidth: 240, lineHeight: 1.4 }}>
        Sync your data across devices and access your full profile.
      </div>
      <div className="mk-button primary" style={{ minWidth: 200, marginTop: 6 }}>Sign In</div>
      <div className="mk-button ghost">Create an account</div>
    </div>
  </div>
);

// ────────── OnboardingView ──────────
const OnboardingView_Welcome = (p) => (
  <div className="ios" {...p}>
    <StatusBar />
    <div style={{
      padding: "32px 24px 0",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center"
    }}>
      <div style={{
        width: 120, height: 120, borderRadius: 28,
        background: "linear-gradient(135deg,#5856D6,#007AFF)",
        display: "grid", placeItems: "center", color: "#fff",
        boxShadow: "0 12px 24px rgba(88,86,214,0.35)"
      }}>
        <Icon name="badge" style={{ width: 56, height: 56 }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, padding: "8px 12px 0" }}>
        Welcome to<br/>MyApp
      </div>
      <div style={{ color: "var(--ios-secondary)", fontSize: 15, padding: "0 18px", lineHeight: 1.4 }}>
        A calmer way to capture, organize, and share what matters.
      </div>
    </div>
    <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="mk-button primary" style={{ width: "100%" }}>Get started</div>
      <div className="mk-button ghost">I already have an account</div>
    </div>
  </div>
);

const OnboardingView_Permissions = (p) => (
  <div className="ios" {...p}>
    <StatusBar />
    <div style={{ padding: "32px 24px 16px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>A few permissions</div>
      <div style={{ color: "var(--ios-secondary)", fontSize: 14, marginTop: 6 }}>
        You can change these any time in Settings.
      </div>
    </div>
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        { tint:"#FF3B30", icon:"bell", t:"Notifications", d:"Reminders & activity" },
        { tint:"#34C759", icon:"location", t:"Location", d:"While using the app" },
        { tint:"#AF52DE", icon:"photo", t:"Photos", d:"Attach images" },
      ].map((r) => (
        <div key={r.t} style={{ background:"var(--ios-cell)", borderRadius:12, padding:12, display:"flex", alignItems:"center", gap:12 }}>
          <span className="ios-row-icon" style={{ background: r.tint, width:36, height:36, flex:"0 0 36px" }}>
            <Icon name={r.icon} color="#fff" style={{ width: 18, height: 18 }} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.t}</div>
            <div style={{ color:"var(--ios-secondary)", fontSize: 12 }}>{r.d}</div>
          </div>
          <div className="mk-button tinted" style={{ height: 28, padding: "0 12px", fontSize: 12, borderRadius: 8 }}>Allow</div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
      <div className="mk-button primary" style={{ width:"100%" }}>Continue</div>
    </div>
  </div>
);

const OnboardingView_SignIn = (p) => (
  <div className="ios" {...p}>
    <StatusBar />
    <div style={{ padding: "32px 24px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Sign in</div>
      <div style={{ color: "var(--ios-secondary)", fontSize: 14, marginTop: 6 }}>
        Use your email to continue.
      </div>
    </div>
    <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background:"var(--ios-bg2)", height: 44, borderRadius: 12, padding: "0 14px", display:"flex", alignItems:"center", color:"var(--ios-tertiary)", fontSize: 15 }}>
        Email
      </div>
      <div style={{ background:"var(--ios-bg2)", height: 44, borderRadius: 12, padding: "0 14px", display:"flex", alignItems:"center", color:"var(--ios-tertiary)", fontSize: 15, justifyContent:"space-between" }}>
        <span>Password</span>
        <Icon name="lock" style={{ width: 16, height: 16 }} />
      </div>
      <div style={{ alignSelf: "flex-end", color: "var(--ios-tint)", fontSize: 13, marginTop: 2 }}>Forgot password?</div>
    </div>
    <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, display:"flex", flexDirection:"column", gap: 8 }}>
      <div className="mk-button primary" style={{ width: "100%" }}>Continue</div>
      <div style={{ display:"flex", alignItems:"center", gap: 10, color:"var(--ios-tertiary)", fontSize: 12, padding: "6px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--ios-sep)" }}></div>
        <span>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--ios-sep)" }}></div>
      </div>
      <div className="mk-button" style={{ width: "100%", background: "#000", color:"#fff" }}> Sign in with Apple</div>
    </div>
  </div>
);

// ────────── Components ──────────
const ButtonPreview = ({ variant }) => {
  const map = {
    Primary: { className: "primary", label: "Continue" },
    Secondary: { className: "secondary", label: "Cancel" },
    Destructive: { className: "destructive", label: "Delete account" },
    Disabled: { className: "disabled", label: "Continue" },
  };
  const v = map[variant];
  return (
    <div className="ios" style={{
      width: 220, height: 80,
      display: "grid", placeItems: "center", padding: 16,
    }}>
      <div className={"mk-button " + v.className} style={{ width: "100%" }}>{v.label}</div>
    </div>
  );
};

const CardPreview = ({ variant }) => {
  const inner = {
    Default: (
      <div className="mk-card">
        <div className="title">Trip to Reykjavík</div>
        <div className="body">A 5-day itinerary with hot springs, glaciers, and the northern lights.</div>
      </div>
    ),
    Compact: (
      <div className="mk-card" style={{ padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#5856D6,#007AFF)" }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Trip to Reykjavík</div>
          <div style={{ color: "#8e8e93", fontSize: 12 }}>5 days · Updated today</div>
        </div>
        <Icon name="play" style={{ width: 16, height: 16, color: "#007AFF" }} />
      </div>
    ),
    WithImage: (
      <div className="mk-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          height: 110,
          background: "linear-gradient(135deg,#0c4a6e 0%,#1e3a8a 40%,#581c87 100%)",
          position: "relative"
        }}>
          <div style={{ position:"absolute", top: 10, left: 12, color:"#fff", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Feature</div>
          <svg viewBox="0 0 320 110" style={{ position:"absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55 }}>
            <path d="M0 60 Q 80 20 160 50 T 320 40" stroke="#a5f3fc" strokeWidth="2" fill="none" />
            <path d="M0 80 Q 80 50 160 75 T 320 65" stroke="#86efac" strokeWidth="2" fill="none" />
            <path d="M0 95 Q 80 70 160 90 T 320 85" stroke="#c4b5fd" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div style={{ padding: 14 }}>
          <div className="title">Aurora</div>
          <div className="body">Northern lights at midnight</div>
        </div>
      </div>
    ),
  }[variant];

  return (
    <div className="ios" style={{
      width: 320, padding: 16,
      background: "var(--ios-bg2)",
      height: "auto",
    }}>
      {inner}
    </div>
  );
};

const ToastPreview = ({ variant }) => {
  const map = {
    Success: { bg:"#34C759", icon:"check", text:"Changes saved" },
    Error: { bg:"#FF3B30", icon:"info", text:"Couldn't connect" },
  };
  const v = map[variant];
  return (
    <div className="ios" style={{ width: 320, padding: 16, background:"var(--ios-bg2)", height: "auto" }}>
      <div className="mk-toast">
        <span className="ic" style={{ background: v.bg }}>
          <Icon name={v.icon} color="#fff" style={{ width: 14, height: 14 }} />
        </span>
        <span>{v.text}</span>
      </div>
    </div>
  );
};

// Renderer dispatch
function MockPreview({ story }) {
  const { kind, variant, dark } = story.mock;
  const darkAttr = dark ? { "data-dark": "true" } : {};
  if (kind === "ContentView") {
    if (variant === "Empty") return <ContentView_Empty {...darkAttr} />;
    if (variant === "Loading") return <ContentView_Loading {...darkAttr} />;
    if (variant === "Error") return <ContentView_Error {...darkAttr} />;
    return <ContentView_Default {...darkAttr} />;
  }
  if (kind === "SettingsView") return <SettingsView_Generic allOn={variant === "AllToggled"} {...darkAttr} />;
  if (kind === "ProfileView") {
    if (variant === "SignedOut") return <ProfileView_SignedOut {...darkAttr} />;
    if (variant === "LongName") return <ProfileView_Generic name="Alexandra Konstantinopolous-Brennan" handle="@alexandra.k" {...darkAttr} />;
    return <ProfileView_Generic {...darkAttr} />;
  }
  if (kind === "OnboardingView") {
    if (variant === "Permissions") return <OnboardingView_Permissions {...darkAttr} />;
    if (variant === "SignIn") return <OnboardingView_SignIn {...darkAttr} />;
    return <OnboardingView_Welcome {...darkAttr} />;
  }
  if (kind === "Button") return <ButtonPreview variant={variant} />;
  if (kind === "Card") return <CardPreview variant={variant} />;
  if (kind === "Toast") return <ToastPreview variant={variant} />;
  return <div className="ios" />;
}

window.PreviewbookMocks = { MockPreview };

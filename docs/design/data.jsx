// data.jsx — Story catalog (mock data for the design)

const generatedAt = "2026-05-25T12:00:00Z";

const STORIES = [
  // Views/ContentView
  {
    id: "Views-ContentView-Default",
    component: "ContentView",
    componentKind: "View",
    name: "Default",
    file: "MyApp/Views/ContentView.swift",
    indexInFile: 0,
    lineRange: [42, 48],
    renderedAt: "2026-05-25 12:00:14",
    durationMs: 412,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "ContentView", variant: "Default", dark: false },
    source: `#Preview("Default") {
  ContentView()
    .environment(AppStore.preview)
}`,
  },
  {
    id: "Views-ContentView-Empty",
    component: "ContentView",
    componentKind: "View",
    name: "Empty",
    file: "MyApp/Views/ContentView.swift",
    indexInFile: 1,
    lineRange: [50, 58],
    renderedAt: "2026-05-25 12:00:14",
    durationMs: 380,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "ContentView", variant: "Empty", dark: false },
    source: `#Preview("Empty") {
  ContentView()
    .environment(AppStore.empty)
}`,
  },
  {
    id: "Views-ContentView-Loading",
    component: "ContentView",
    componentKind: "View",
    name: "Loading",
    file: "MyApp/Views/ContentView.swift",
    indexInFile: 2,
    lineRange: [60, 68],
    renderedAt: "2026-05-25 12:00:15",
    durationMs: 401,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "ContentView", variant: "Loading", dark: false },
    source: `#Preview("Loading") {
  ContentView()
    .environment(AppStore.loading)
}`,
  },
  {
    id: "Views-ContentView-Error",
    component: "ContentView",
    componentKind: "View",
    name: "Error",
    file: "MyApp/Views/ContentView.swift",
    indexInFile: 3,
    lineRange: [70, 80],
    renderedAt: "2026-05-25 12:00:15",
    durationMs: 391,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "ContentView", variant: "Error", dark: false },
    source: `#Preview("Error") {
  ContentView()
    .environment(AppStore.failed(.network))
}`,
  },
  {
    id: "Views-ContentView-Dark",
    component: "ContentView",
    componentKind: "View",
    name: "Dark",
    file: "MyApp/Views/ContentView.swift",
    indexInFile: 4,
    lineRange: [82, 90],
    renderedAt: "2026-05-25 12:00:16",
    durationMs: 422,
    canvasSize: [390, 844],
    appearance: "Dark",
    device: "iPhone 15",
    mock: { kind: "ContentView", variant: "Default", dark: true },
    source: `#Preview("Dark") {
  ContentView()
    .environment(AppStore.preview)
    .preferredColorScheme(.dark)
}`,
  },

  // Views/SettingsView
  {
    id: "Views-SettingsView-Default",
    component: "SettingsView",
    componentKind: "View",
    name: "Default",
    file: "MyApp/Views/SettingsView.swift",
    indexInFile: 0,
    lineRange: [88, 94],
    renderedAt: "2026-05-25 12:00:17",
    durationMs: 358,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "SettingsView", variant: "Default", dark: false },
    source: `#Preview("Default") {
  SettingsView()
    .environment(Settings.preview)
}`,
  },
  {
    id: "Views-SettingsView-AllToggled",
    component: "SettingsView",
    componentKind: "View",
    name: "All Toggled",
    file: "MyApp/Views/SettingsView.swift",
    indexInFile: 1,
    lineRange: [96, 104],
    renderedAt: "2026-05-25 12:00:17",
    durationMs: 364,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "SettingsView", variant: "AllToggled", dark: false },
    source: `#Preview("All Toggled") {
  SettingsView()
    .environment(Settings.allEnabled)
}`,
  },
  {
    id: "Views-SettingsView-Dark",
    component: "SettingsView",
    componentKind: "View",
    name: "Dark",
    file: "MyApp/Views/SettingsView.swift",
    indexInFile: 2,
    lineRange: [106, 114],
    renderedAt: "2026-05-25 12:00:18",
    durationMs: 372,
    canvasSize: [390, 844],
    appearance: "Dark",
    device: "iPhone 15",
    mock: { kind: "SettingsView", variant: "Default", dark: true },
    source: `#Preview("Dark") {
  SettingsView()
    .environment(Settings.preview)
    .preferredColorScheme(.dark)
}`,
  },

  // Views/ProfileView
  {
    id: "Views-ProfileView-Default",
    component: "ProfileView",
    componentKind: "View",
    name: "Default",
    file: "MyApp/Views/ProfileView.swift",
    indexInFile: 0,
    lineRange: [62, 68],
    renderedAt: "2026-05-25 12:00:19",
    durationMs: 322,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "ProfileView", variant: "Default", dark: false },
    source: `#Preview("Default") {
  ProfileView(user: .mock)
}`,
  },
  {
    id: "Views-ProfileView-SignedOut",
    component: "ProfileView",
    componentKind: "View",
    name: "Signed Out",
    file: "MyApp/Views/ProfileView.swift",
    indexInFile: 1,
    lineRange: [70, 76],
    renderedAt: "2026-05-25 12:00:19",
    durationMs: 314,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "ProfileView", variant: "SignedOut", dark: false },
    source: `#Preview("Signed Out") {
  ProfileView(user: nil)
}`,
  },
  {
    id: "Views-ProfileView-LongName",
    component: "ProfileView",
    componentKind: "View",
    name: "Long Name",
    file: "MyApp/Views/ProfileView.swift",
    indexInFile: 2,
    lineRange: [78, 84],
    renderedAt: "2026-05-25 12:00:20",
    durationMs: 329,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "ProfileView", variant: "LongName", dark: false },
    source: `#Preview("Long Name") {
  ProfileView(user: .longName)
}`,
  },
  {
    id: "Views-ProfileView-Dark",
    component: "ProfileView",
    componentKind: "View",
    name: "Dark",
    file: "MyApp/Views/ProfileView.swift",
    indexInFile: 3,
    lineRange: [86, 93],
    renderedAt: "2026-05-25 12:00:20",
    durationMs: 337,
    canvasSize: [390, 844],
    appearance: "Dark",
    device: "iPhone 15",
    mock: { kind: "ProfileView", variant: "Default", dark: true },
    source: `#Preview("Dark") {
  ProfileView(user: .mock)
    .preferredColorScheme(.dark)
}`,
  },

  // Views/OnboardingView
  {
    id: "Views-OnboardingView-Welcome",
    component: "OnboardingView",
    componentKind: "View",
    name: "Welcome",
    file: "MyApp/Views/OnboardingView.swift",
    indexInFile: 0,
    lineRange: [54, 60],
    renderedAt: "2026-05-25 12:00:21",
    durationMs: 298,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "OnboardingView", variant: "Welcome", dark: false },
    source: `#Preview("Welcome") {
  OnboardingView(step: .welcome)
}`,
  },
  {
    id: "Views-OnboardingView-Permissions",
    component: "OnboardingView",
    componentKind: "View",
    name: "Permissions",
    file: "MyApp/Views/OnboardingView.swift",
    indexInFile: 1,
    lineRange: [62, 68],
    renderedAt: "2026-05-25 12:00:22",
    durationMs: 311,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "OnboardingView", variant: "Permissions", dark: false },
    source: `#Preview("Permissions") {
  OnboardingView(step: .permissions)
}`,
  },
  {
    id: "Views-OnboardingView-SignIn",
    component: "OnboardingView",
    componentKind: "View",
    name: "Sign In",
    file: "MyApp/Views/OnboardingView.swift",
    indexInFile: 2,
    lineRange: [70, 76],
    renderedAt: "2026-05-25 12:00:22",
    durationMs: 305,
    canvasSize: [390, 844],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "OnboardingView", variant: "SignIn", dark: false },
    source: `#Preview("Sign In") {
  OnboardingView(step: .signIn)
}`,
  },
  {
    id: "Views-OnboardingView-Dark",
    component: "OnboardingView",
    componentKind: "View",
    name: "Dark",
    file: "MyApp/Views/OnboardingView.swift",
    indexInFile: 3,
    lineRange: [78, 85],
    renderedAt: "2026-05-25 12:00:23",
    durationMs: 318,
    canvasSize: [390, 844],
    appearance: "Dark",
    device: "iPhone 15",
    mock: { kind: "OnboardingView", variant: "Welcome", dark: true },
    source: `#Preview("Dark") {
  OnboardingView(step: .welcome)
    .preferredColorScheme(.dark)
}`,
  },

  // Components/Button
  {
    id: "Components-Button-Primary",
    component: "Button",
    componentKind: "Component",
    name: "Primary",
    file: "MyApp/Components/PrimaryButton.swift",
    indexInFile: 0,
    lineRange: [38, 43],
    renderedAt: "2026-05-25 12:00:24",
    durationMs: 132,
    canvasSize: [220, 80],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Button", variant: "Primary", dark: false },
    source: `#Preview("Primary") {
  PrimaryButton("Continue") { }
    .padding()
}`,
  },
  {
    id: "Components-Button-Secondary",
    component: "Button",
    componentKind: "Component",
    name: "Secondary",
    file: "MyApp/Components/PrimaryButton.swift",
    indexInFile: 1,
    lineRange: [45, 51],
    renderedAt: "2026-05-25 12:00:24",
    durationMs: 124,
    canvasSize: [220, 80],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Button", variant: "Secondary", dark: false },
    source: `#Preview("Secondary") {
  PrimaryButton("Cancel", style: .secondary) { }
    .padding()
}`,
  },
  {
    id: "Components-Button-Destructive",
    component: "Button",
    componentKind: "Component",
    name: "Destructive",
    file: "MyApp/Components/PrimaryButton.swift",
    indexInFile: 2,
    lineRange: [53, 59],
    renderedAt: "2026-05-25 12:00:25",
    durationMs: 121,
    canvasSize: [220, 80],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Button", variant: "Destructive", dark: false },
    source: `#Preview("Destructive") {
  PrimaryButton("Delete", style: .destructive) { }
    .padding()
}`,
  },
  {
    id: "Components-Button-Disabled",
    component: "Button",
    componentKind: "Component",
    name: "Disabled",
    file: "MyApp/Components/PrimaryButton.swift",
    indexInFile: 3,
    lineRange: [61, 68],
    renderedAt: "2026-05-25 12:00:25",
    durationMs: 119,
    canvasSize: [220, 80],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Button", variant: "Disabled", dark: false },
    source: `#Preview("Disabled") {
  PrimaryButton("Continue") { }
    .disabled(true)
    .padding()
}`,
  },

  // Components/Card
  {
    id: "Components-Card-Default",
    component: "Card",
    componentKind: "Component",
    name: "Default",
    file: "MyApp/Components/Card.swift",
    indexInFile: 0,
    lineRange: [44, 51],
    renderedAt: "2026-05-25 12:00:26",
    durationMs: 158,
    canvasSize: [320, 180],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Card", variant: "Default", dark: false },
    source: `#Preview("Default") {
  Card(title: "Title", body: "Lorem ipsum dolor")
    .padding()
}`,
  },
  {
    id: "Components-Card-Compact",
    component: "Card",
    componentKind: "Component",
    name: "Compact",
    file: "MyApp/Components/Card.swift",
    indexInFile: 1,
    lineRange: [53, 60],
    renderedAt: "2026-05-25 12:00:26",
    durationMs: 142,
    canvasSize: [320, 120],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Card", variant: "Compact", dark: false },
    source: `#Preview("Compact") {
  Card(title: "Title", style: .compact)
    .padding()
}`,
  },
  {
    id: "Components-Card-WithImage",
    component: "Card",
    componentKind: "Component",
    name: "With Image",
    file: "MyApp/Components/Card.swift",
    indexInFile: 2,
    lineRange: [62, 71],
    renderedAt: "2026-05-25 12:00:27",
    durationMs: 184,
    canvasSize: [320, 240],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Card", variant: "WithImage", dark: false },
    source: `#Preview("With Image") {
  Card(title: "Aurora",
       body: "Northern lights at midnight",
       image: .aurora)
    .padding()
}`,
  },

  // Components/Toast
  {
    id: "Components-Toast-Success",
    component: "Toast",
    componentKind: "Component",
    name: "Success",
    file: "MyApp/Components/Toast.swift",
    indexInFile: 0,
    lineRange: [42, 47],
    renderedAt: "2026-05-25 12:00:28",
    durationMs: 102,
    canvasSize: [320, 100],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Toast", variant: "Success", dark: false },
    source: `#Preview("Success") {
  Toast(.success("Saved"))
    .padding()
}`,
  },
  {
    id: "Components-Toast-Error",
    component: "Toast",
    componentKind: "Component",
    name: "Error",
    file: "MyApp/Components/Toast.swift",
    indexInFile: 1,
    lineRange: [49, 54],
    renderedAt: "2026-05-25 12:00:28",
    durationMs: 99,
    canvasSize: [320, 100],
    appearance: "Light",
    device: "iPhone 15",
    mock: { kind: "Toast", variant: "Error", dark: false },
    source: `#Preview("Error") {
  Toast(.error("Couldn't connect"))
    .padding()
}`,
  },
];

// Build tree
function buildTree(stories) {
  const groups = new Map();
  for (const s of stories) {
    const groupName = s.file.split("/")[1] || "Other"; // MyApp/<group>/...
    if (!groups.has(groupName)) groups.set(groupName, new Map());
    const compMap = groups.get(groupName);
    if (!compMap.has(s.component)) {
      compMap.set(s.component, {
        component: s.component,
        kind: s.componentKind,
        file: s.file,
        stories: [],
      });
    }
    compMap.get(s.component).stories.push(s);
  }

  const tree = [];
  for (const [groupName, compMap] of groups) {
    tree.push({
      type: "group",
      name: groupName,
      children: Array.from(compMap.values()).map((c) => ({
        type: "component",
        ...c,
      })),
    });
  }
  return tree;
}

const TREE = buildTree(STORIES);

window.PreviewbookData = { STORIES, TREE, generatedAt };

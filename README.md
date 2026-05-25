# previewbook

[![npm](https://img.shields.io/npm/v/@henteko/previewbook)](https://www.npmjs.com/package/@henteko/previewbook)
[![node](https://img.shields.io/node/v/@henteko/previewbook)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

SwiftUI の `#Preview` / `PreviewProvider` を **コンポーネント単位で階層化し、ナビゲーション・検索・ソース表示を備えたウェブサイト（Storybook ライク）として閲覧する** CLI ツールです。

Xcode の MCP サーバーに JSON-RPC 2.0 over stdio で接続し、各プレビューをレンダリングしてスナップショット（PNG）を取得します。設計の詳細は [`docs/previewbook-design.md`](docs/previewbook-design.md) を参照してください。

![previewbook のスクリーンショット](docs/design/screenshots/08-topbar-fix.png)

## 特長

- 🗂 **階層ナビゲーション** — ディレクトリ → ファイル → Story のツリー。折りたたみ・フィルタ対応。
- 🔍 **コマンドパレット** — `⌘K` でコンポーネント / Story / ファイルを横断検索。
- 🖼 **キャンバス** — レンダリング済みスナップショットをズーム / ライトボックス表示。
- 📄 **Source / Info** — `#Preview` のソース断片（シンタックスハイライト）とメタ情報。
- 🌗 **ライト / ダーク** — サイトのテーマ切替。`#/Group/Component/Story` で deep-link 共有。
- 📦 **外部依存ゼロの出力** — `index.html` に CSS / JS をインライン化。`build` した一式は `file://` でも動作。

## 必要環境

- Node.js 20 以上
- macOS + **Xcode（MCP ブリッジ `xcrun mcpbridge` を同梱するバージョン）**
- 対象プロジェクトを Xcode で開いておくこと

### Xcode のセットアップ

本ツールは `xcrun mcpbridge` で Xcode の MCP サーバーに接続します。`mcpbridge` は比較的新しい Xcode に同梱されるため、次を満たしておいてください。

1. **Xcode を最新に更新する。** `mcpbridge` を含まない古い Xcode では、起動時に
   `MCP bridge exited unexpectedly (code=72)` や `xcrun: error: unable to find utility "mcpbridge"`
   になります。Xcode をアップデートすると解消します（動作確認は Xcode 26.0.1）。
2. フル Xcode が選択されていることを確認する（Command Line Tools だけでは不可）。
   ```bash
   xcode-select -p            # /Applications/Xcode.app/... を指していること
   xcrun --find mcpbridge     # パスが表示されれば OK
   ```
   違う場合は `sudo xcode-select -s /Applications/Xcode.app` で切り替えます。
3. **対象プロジェクトを Xcode で開いておく**（ウィンドウが MCP の対象になります）。
4. 複数のプロジェクトを開いている場合は `--project <名前/パスの一部>` で対象を指定します。

## インストール

```bash
# グローバルにインストールして使う
npm install -g @henteko/previewbook
previewbook

# 単発で実行する
npx @henteko/previewbook
```

ソースから動かす場合:

```bash
git clone https://github.com/henteko/previewbook.git
cd previewbook
npm install
npm run build
```

## 使い方

CLI のサーフェスは設計どおり基本 2 つです。

```bash
# 撮影してローカルサーバーを起動し、ブラウザでサイトを開く
previewbook

# 撮影して静的ファイル一式を ./out に書き出す
previewbook build -o ./out
```

ソースから動かす場合はビルドせずに実行できます。

```bash
npm run dev               # = previewbook（サーブ）
npm run dev -- build -o ./out
```

### 主なオプション

| オプション | 説明 |
|---|---|
| `-o, --output <path>` | 出力先（`build` で必須） |
| `--project <hint>` | Xcode ウィンドウが複数開いているときの絞り込み |
| `--title <text>` | サイトタイトルの上書き |
| `--port <number>` | サーブ時のポート（既定: ランダム） |
| `--no-open` | ブラウザを自動で開かない（サーブ時） |
| `--timeout <sec>` | `RenderPreview` の 1 枚あたりタイムアウト |
| `-v, --verbose` | 詳細ログ（MCP の生のやり取り `tools/call ... <- ...` も表示） |

### 環境変数（MCP ブリッジの上書き）

`xcrun mcpbridge` 以外のコマンドで MCP に接続したい場合に使用します。

```bash
PREVIEWBOOK_BRIDGE_CMD=/path/to/bridge
PREVIEWBOOK_BRIDGE_ARGS="--stdio --foo"
```

## UI をすぐ見る（デモ）

Xcode / MCP なしで UI をブラウザで確認できます。サンプルデータと色つきのダミー PNG から静的サイトを生成します。

```bash
npm run demo
open examples/demo-site/index.html
```

## 仕組み

```
ProjectDiscovery で対象プロジェクト + tabIdentifier を確定
  → SnapshotService がプレビューを探索（XcodeGrep）
  → 各プレビューを RenderPreview で撮影
  → PreviewMetadataParser で名前・型・ソース断片を付与
  → buildCatalog で stories.json のツリーに集約
  → emitManifest: stories.json + assets/*.png を出力
  → generateSite: index.html（CSS/JS インライン）を生成
  → [既定] PreviewServer でサーブ / [build] 出力先へ書き出し
```

UI の見た目は [`src/site/assets/styles.css`](src/site/assets/styles.css)、挙動は [`src/site/assets/app.js`](src/site/assets/app.js) にあります。データ契約（`stories.json`）に触れずに差し替え・調整でき、生成時に `index.html` へインライン化されます。

## データモデル（`stories.json`）

サイトはこの JSON を読み込んで描画します（サーブ時は `fetch`、`build` 時は HTML に JS 変数として埋め込み）。

```jsonc
{
  "title": "MyApp Preview Book",
  "generatedAt": "2026-05-25T12:00:00Z",
  "tree": [
    {
      "type": "group", "name": "Views",
      "children": [{
        "type": "component", "name": "ContentView",
        "sourceFile": "MyApp/Views/ContentView.swift",
        "stories": [
          {
            "id": "contentview-default",
            "name": "Default",
            "asset": "assets/contentview_0.png",
            "source": "#Preview(\"Default\") { ContentView() }",
            "file": "MyApp/Views/ContentView.swift",
            "index": 0,
            "targetType": "ContentView",
            "kind": "macro",
            "line": 42,
            "endLine": 44
          }
        ]
      }]
    }
  ]
}
```

## 開発

```bash
npm run typecheck   # 型チェック
npm test            # ユニットテスト（node:test）
npm run build       # dist/ へコンパイル（site アセットもコピー）
```

## 限界

- MCP は静的レンダリングのため、Storybook の Controls（args を動かして即反映）は非対応。バリエーションは開発者が書いた `#Preview` をそのまま 1 Story として並べます。
- 撮影はプレビュー数だけ `RenderPreview` を逐次実行するため時間がかかります。

## ライセンス

[Apache License 2.0](LICENSE) © henteko

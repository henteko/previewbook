# previewbook

SwiftUI の `#Preview` / `PreviewProvider` を **コンポーネント単位で階層化し、ナビゲーション・検索・ソース表示を備えたウェブサイト（Storybook ライク）として閲覧する** CLI ツールです。

Xcode の MCP サーバーに JSON-RPC 2.0 over stdio で接続し、各プレビューをレンダリングしてスナップショット（PNG）を取得します。設計の詳細は [`docs/previewbook-design.md`](docs/previewbook-design.md) を参照してください。

> **デザインについて**: 現在のウェブ UI は **仮（プレースホルダ）** です。最終デザインは別途デザイナーが制作中で、後から差し替えます。仮 UI のスタイルと挙動は [`src/site/templates.ts`](src/site/templates.ts) に集約してあるため、データ構造に手を触れず丸ごと置き換えられます。

## 必要環境

- Node.js 20 以上
- macOS + Xcode（MCP ブリッジ `xcrun mcpbridge` 経由でプレビューをレンダリングします）
- 対象プロジェクトを Xcode で開いておくこと

## セットアップ

```bash
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

開発中はビルドせずに実行できます。

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
| `-v, --verbose` | 詳細ログ |

### 環境変数（MCP ブリッジの上書き）

`xcrun mcpbridge` 以外のコマンドで MCP に接続したい場合に使用します。

```bash
PREVIEWBOOK_BRIDGE_CMD=/path/to/bridge
PREVIEWBOOK_BRIDGE_ARGS="--stdio --foo"
```

## 仮 UI をすぐ見る（デモ）

Xcode / MCP なしで、仮 UI をブラウザで確認できます。サンプルデータと色つきのダミー PNG から静的サイトを生成します。

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
            "targetType": "ContentView"
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
npm run build       # dist/ へコンパイル
```

## 限界

- MCP は静的レンダリングのため、Storybook の Controls（args を動かして即反映）は非対応。バリエーションは開発者が書いた `#Preview` をそのまま 1 Story として並べます。
- 撮影はプレビュー数だけ `RenderPreview` を逐次実行するため時間がかかります。

## ライセンス

MIT

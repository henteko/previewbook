# previewbook 設計メモ

SwiftUI のプレビューを **コンポーネント単位で階層化し、ナビゲーション・検索・ソース表示を備えたウェブサイト（Storybook ライク）として閲覧できる** CLI ツールの設計案。仮称 `previewbook`。

Xcode の MCP サーバーに JSON-RPC 2.0 over stdio で接続し、各 `#Preview` / `PreviewProvider` をレンダリングしてスナップショットを取得する。すべての機能を新規に実装する前提とする。

---

## 1. 前提となる制約

設計全体を規定する重要な制約。

- MCP の `RenderPreview` が受け取れる引数は `tabIdentifier` / `sourceFilePath` / `previewDefinitionIndexInFile` / `timeout` の4つのみ。
  - **デバイス・外観（ライト/ダーク）・サイズを引数で上書きできない。**
- `RenderPreview` の戻り値は `{"previewSnapshotPath": "..."}` のみで、サイズや外観などのメタデータを含まない。

→ Storybook の「Controls で args を動かしてバリエーションを切り替える」相当は MCP では直接実現できない。
**バリエーションはソース内の `#Preview` 定義そのものから生む**のが基本路線になる。

---

## 2. コンセプト

プレビューをコンポーネント単位で階層化し、ナビゲーション・検索・ソース表示を持つウェブサイトとして閲覧する

ことを目的とする。

ツールの動作は大きく次の3段階。

1. メタデータ抽出
2. マニフェスト生成
3. サイト生成（サーブ または 静的出力）

---

## 3. Storybook 概念 → SwiftUI / MCP のマッピング

| Storybook | 本ツールでの対応 | 取得方法 |
|---|---|---|
| Component（サイドバーの親ノード） | ソースファイル / プレビュー対象の View 型 | `XcodeGrep` で発見 |
| Story（1つの見え方） | 各 `#Preview` / `PreviewProvider` 定義 | `previewDefinitionIndexInFile` ごと |
| Story 名 | `#Preview("ラベル")` のラベル文字列 | `XcodeRead` で本文を読みパース |
| 階層（フォルダツリー） | ファイルパスのディレクトリ構造 | パス分割 |
| Canvas | レンダリング済み PNG | `RenderPreview` |
| Docs / Source タブ | `#Preview` 周辺のソース断片 | `XcodeRead` |
| Controls（args 動的変更） | **非対応** | — |

---

## 4. バリエーションの作り方

ライト/ダークやデバイス違いなど、複数の見え方は **開発者が書いた `#Preview` 定義をそのまま 1 つ＝ 1 Story として並べる**ことで表現する。

- プロジェクトのソースを一切変更しない。
- ダーク版が欲しければ開発者が `#Preview` を追加する、という Storybook と同じ流儀。
- メタデータ抽出（Story 名・対象型・ソース断片）を行うだけで完結する。

`RenderPreview` に外観やデバイスを渡す手段がない以上、ツール側で variant を合成することはしない。

---

## 5. アーキテクチャ（すべて新規実装）

```
Transport              : xcrun mcpbridge を起動し stdio で JSON-RPC 2.0 通信
JSONRPC                : JSON-RPC 2.0 メッセージ型
MCPClient (actor)      : 接続・リクエスト/レスポンス対応付け・ツール呼び出しを管理
Parser 群              : XcodeListWindows / XcodeGrep / RenderPreview の結果をパース
ProjectDiscovery       : 対象プロジェクトの解決とウィンドウマッチング
SnapshotService        : プレビュー探索 + 逐次レンダリング + PNG 取得
PreviewMetadataParser  : XcodeRead の本文から #Preview のラベル・対象型・行範囲を抽出
StoryCatalog (model)   : ファイル→Story の階層 + メタデータを保持する Sendable 構造体
CatalogManifestEmitter : stories.json と assets/*.png を出力
SiteGenerator          : index.html + app.js（テンプレートを埋め込み）を出力
PreviewServer          : 生成した静的サイトをローカル HTTP でサーブ
CLI                    : サブコマンド（デフォルト=サーブ / build=静的出力）
```

### データの流れ

```
ProjectDiscovery で対象プロジェクト + tabIdentifier を確定
   → SnapshotService がプレビューを探索（XcodeGrep）
   → 各プレビューを RenderPreview で撮影
   → PreviewMetadataParser で名前・型・ソース断片を付与
   → StoryCatalog に集約
   → CatalogManifestEmitter: stories.json + assets/ へ PNG 出力
   → SiteGenerator: index.html (+ app.js) を生成
   → [デフォルト] PreviewServer でサーブ / [build] 出力先へ書き出し
```

---

## 6. データモデル（`stories.json`）

サイト側は「SPA がこの JSON を読み込んで描画する」設計にすると、UI とデータが疎結合になり拡張しやすい。

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
            "id": "ContentView-default",
            "name": "Default",                  // #Preview("Default")
            "asset": "assets/ContentView_0.png",
            "source": "#Preview(\"Default\") { ContentView() }"
          },
          {
            "id": "ContentView-dark",
            "name": "Dark",                      // 開発者が書いた別 #Preview
            "asset": "assets/ContentView_1.png",
            "source": "#Preview(\"Dark\") { ContentView().preferredColorScheme(.dark) }"
          }
        ]
      }]
    }
  ]
}
```

---

## 7. サイト構成と UI レイアウト

外部依存ゼロ（CSS / JS インライン）・HTML エスケープ徹底を方針とし、**3 ペインの Explorer** を構成する。

```
┌──────────────┬─────────────────────────────┬───────────────┐
│  検索 [____]  │                             │  Source       │
│              │                             │  #Preview(... │
│ ▾ Views      │        ┌───────────┐        │    Content... │
│   ▾ Content  │        │           │        │  }            │
│     • Default│        │  snapshot │        ├───────────────┤
│     • Dark ◀ │        │   (PNG)   │        │  Metadata     │
│   ▸ Settings │        │           │        │  file: ...    │
│ ▸ Components │        └───────────┘        │  index: 1     │
│              │        [拡大] [⬇]            │               │
└──────────────┴─────────────────────────────┴───────────────┘
```

### 機能要点

- **左サイドバー**：ディレクトリ → ファイル → Story のツリー。折りたたみ・検索フィルタ。
- **中央キャンバス**：選択 Story の PNG をズーム／クリックで拡大（ライトボックス）。
- **右パネル**：`XcodeRead` で取った `#Preview` ソース断片と、ファイル / index 等のメタ情報。
- **URL ハッシュ連携**：`#/Views/ContentView/Dark` で deep-link & 共有可能。
- **サイトのテーマ切替**：サイト自体（クローム）のライト/ダークは CSS で切り替える。

### 実装上の注意

- デフォルトコマンドは HTTP でサーブするため、SPA が `stories.json` を `fetch` できる。
- `build` で出力した静的ファイルは `file://` で開くと `fetch` が CORS で弾かれるため、**マニフェストを JS 変数として HTML に埋め込む**方式で出力する。

---

## 8. CLI サーフェス

コマンドは2つのみ。その他のオプションは持たない。

```bash
previewbook                   # 撮影してローカルサーバーを起動し、ブラウザで HTML をサーブ
previewbook build -o ./path   # 撮影して静的ファイル一式を ./path に出力
```

- `previewbook`（デフォルト）：プレビューを撮影し、その場でローカル HTTP サーバーを起動してサイトを配信する。
- `previewbook build -o <path>`：同じ撮影・生成を行い、`<path>` に静的ファイル（`index.html` / `assets/`）を書き出す。

---

## 9. 限界と発展余地

### 限界

- **静的であってインタラクティブではない**：MCP は静的レンダリングなので、「args を動かして即反映」は不可能。ナビ・検索・比較・ソース表示までが現実的な到達点。
- **撮影が逐次で遅い**：プレビュー数だけ `RenderPreview` が走る。

### 発展

- **差分ビルド / キャッシュ**：`XcodeRead` の内容ハッシュで未変更ファイルの撮影をスキップし、再生成を高速化。
- **ビジュアルリグレッション**：撮影済み PNG を Git にコミットしておけば、再生成時に旧版との差分（変わった Story のハイライト、Chromatic 的な体験）を出せる。スナップショット基盤と相性が非常に良い。


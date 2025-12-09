# AI Chat Bot - 実装TODOリスト

## このTODOリストの使い方

### 進捗管理ルール
1. **タスク開始時**: TodoWriteツールで該当タスクを `in_progress` に設定
2. **実装完了時**:
   - TodoWriteツールでタスクを `completed` に設定
   - このファイル（TODO.md）の該当チェックボックスを `[x]` に更新
3. **コミット前**: 必ずTODO.mdを更新してからGitコミット

### チェックボックスの意味
- `[ ]` = 未着手
- `[x]` = 完了

### 注意事項
- 各タスク完了後は必ずこのファイルを更新すること
- CLAUDE.mdの「開発ワークフロー」セクションも参照すること
- テストコード作成時は、グローバルCLAUDE.mdの「テストコード作成時の厳守事項」を遵守

---

## Phase 1: プロジェクト初期セットアップ

### 1.1 プロジェクト作成
- [x] Next.js プロジェクトを作成
  ```bash
  npx create-next-app@latest ai-chat --typescript --tailwind --app --use-pnpm --turbopack
  cd ai-chat
  ```
- [x] Git リポジトリ初期化（create-next-appで自動初期化）
- [x] Biome のセットアップ
  ```bash
  pnpm add -D -E @biomejs/biome
  npx @biomejs/biome init
  ```

### 1.2 必要なパッケージのインストール
- [x] shadcn/ui のセットアップ
  ```bash
  npx shadcn@latest init
  ```
- [x] Prisma のインストール
  ```bash
  pnpm add prisma @prisma/client
  npx prisma init
  ```
- [x] Hono のインストール
  ```bash
  pnpm add hono
  ```
- [x] Claude SDK のインストール
  ```bash
  pnpm add @anthropic-ai/sdk
  ```
- [x] Mastra のインストール
  ```bash
  pnpm add @mastra/core
  ```
- [x] その他必要なパッケージ
  ```bash
  pnpm add uuid nanoid
  ```

### 1.3 環境変数設定
- [x] `.env.local` ファイルを作成
  ```env
  ANTHROPIC_API_KEY=
  DATABASE_URL=
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  SESSION_SECRET=
  ```
- [x] `.env.example` を作成（テンプレート用）
- [x] `.gitignore` に `.env.local` が含まれているか確認（`.env*`で対応済み）

### 1.4 テスト環境セットアップ（Vitest）
- [x] Vitest と関連パッケージのインストール
  ```bash
  pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
  ```
- [x] `vitest.config.ts` を作成
  ```typescript
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['**/*.test.{ts,tsx}'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  })
  ```
- [x] `src/test/setup.ts` を作成
  ```typescript
  import '@testing-library/jest-dom'
  ```
- [x] `package.json` にテストスクリプトを追加
  ```json
  {
    "scripts": {
      "test": "vitest",
      "test:run": "vitest run",
      "test:coverage": "vitest run --coverage"
    }
  }
  ```

---

## Phase 2: データベース設定

### 2.1 MongoDB Atlas セットアップ
- [x] MongoDB Atlas でクラスタを作成
- [x] データベースユーザーを作成（mongodb/mongodb）
- [x] IPアドレスをホワイトリストに追加
- [x] 接続文字列を取得し、`.env.local` に設定

### 2.2 Prisma スキーマ設定
- [x] `prisma/schema.prisma` を編集してMongoDBコネクタを設定
  ```prisma
  datasource db {
    provider = "mongodb"
  }

  generator client {
    provider = "prisma-client-js"
  }
  ```
  **注**: Prisma 7では、DATABASE_URLは`prisma.config.ts`で設定します
- [x] Conversation モデルを定義
- [x] Message モデルを定義
- [x] Prisma Client を生成
  ```bash
  npx prisma generate
  ```
- [x] データベースに接続確認
  ```bash
  npx prisma db push
  ```
  ✅ Conversationコレクション作成済み
  ✅ Messageコレクション作成済み

### 2.3 Prisma クライアント設定
- [x] `src/lib/prisma.ts` を作成
  ```typescript
  import { PrismaClient } from '@prisma/client'

  const globalForPrisma = global as unknown as { prisma: PrismaClient }

  export const prisma = globalForPrisma.prisma || new PrismaClient()

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```

---

## Phase 3: UI基盤の構築

### 3.1 shadcn/ui コンポーネントのインストール
- [x] 必要なコンポーネントを追加
  ```bash
  npx shadcn@latest add button input card scroll-area avatar
  ```
  ✅ button, input, card, scroll-area, avatar コンポーネント追加済み

### 3.2 レイアウトの作成
- [x] `app/layout.tsx` を編集
  - [x] メタデータ設定（タイトル: AI Chat Bot、説明追加）
  - [x] フォント設定（Geist Sans, Geist Mono）
  - [x] グローバルスタイル（min-h-screen, bg-background追加）
  - [x] SessionProviderの統合
- [x] 言語設定を日本語に変更（lang="ja"）

### 3.3 セッション管理の実装
- [x] `src/lib/session.ts` を作成
  - [x] セッションID生成関数（nanoid使用）
  - [x] セッション取得/保存関数（localStorage）
  - [x] セッションクリア関数
- [x] `src/components/SessionProvider.tsx` を作成
  - [x] クライアントサイドのセッション管理
  - [x] localStorageでセッションID保存
  - [x] useSessionカスタムフック提供

---

## Phase 4: チャットUIコンポーネントの実装

### 4.1 基本コンポーネント作成
- [x] `components/chat/Message.tsx` を作成
  - [x] ユーザーメッセージとAIメッセージの表示
  - [x] アバター表示
  - [x] タイムスタンプ表示
- [x] `components/chat/MessageList.tsx` を作成
  - [x] メッセージ一覧の表示
  - [x] 自動スクロール機能
  - [x] ScrollAreaコンポーネント使用
- [x] `components/chat/MessageInput.tsx` を作成
  - [x] テキスト入力フィールド
  - [x] 送信ボタン
  - [x] Enterキーでの送信対応
  - [x] 送信中の無効化処理
- [x] `components/chat/ChatWindow.tsx` を作成
  - [x] MessageListとMessageInputを統合
  - [x] ローディング状態の管理
  - [x] エラーハンドリング

### 4.2 メインページの実装
- [x] `app/page.tsx` を作成
  - [x] ChatWindowコンポーネントを配置
  - [x] レスポンシブレイアウト
  - [x] ヘッダー/フッター（必要に応じて）

---

## Phase 5: AI/Mastra統合

### 5.1 Claude API クライアント設定
- [x] `lib/claude.ts` を作成
  ```typescript
  import Anthropic from '@anthropic-ai/sdk'

  export const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
  ```

### 5.2 Mastra エージェント設定
- [x] `lib/mastra.ts` を作成
  - [x] Mastraエージェントの初期化
  - [x] Claude統合設定
  - [x] システムプロンプトの定義
- [ ] エージェントの動作確認用スクリプト作成（任意）

---

## Phase 6: API実装

### 6.1 チャットAPIの実装（SSE）
- [x] `app/api/chat/route.ts` を作成
  - [x] POSTメソッドの実装
  - [x] リクエストボディからメッセージとセッションIDを取得
  - [x] セッション検証/作成
  - [x] Claudeストリーミングレスポンスの取得
  - [x] SSE形式でのレスポンス返却
  - [x] メッセージのDB保存（ユーザー/アシスタント両方）
  - [x] エラーハンドリング

### 6.2 会話履歴取得APIの実装
- [x] `app/api/conversations/route.ts` を作成
  - [x] GETメソッドの実装
  - [x] セッションIDからConversationを取得
  - [x] 関連するMessageを含めて返却
  - [ ] ページネーション対応（任意）

### 6.3 会話作成APIの実装（任意）
- [x] `app/api/conversations/route.ts` にPOSTメソッド追加
  - [x] 新しい会話セッションの作成

---

## Phase 7: フロントエンド統合

### 7.1 SSEクライアントの実装
- [x] `lib/sse-client.ts` を作成
  - [x] EventSourceまたはfetch APIを使用
  - [x] ストリーミングレスポンスの処理
  - [x] エラーハンドリング
  - [x] 再接続ロジック

### 7.2 ChatWindowでのAPI連携
- [x] メッセージ送信機能の実装
  - [x] ユーザーメッセージをAPIに送信
  - [x] SSEレスポンスをリアルタイムで表示
  - [x] 送信中の状態管理
- [x] 会話履歴の読み込み
  - [x] 初回ロード時に過去の会話を取得
  - [x] 表示の実装

### 7.3 状態管理の実装
- [x] useStateまたはuseReducerで状態管理
  - [x] メッセージリスト
  - [x] 入力中のテキスト
  - [x] ローディング状態
  - [x] エラー状態
- [x] カスタムフック作成（任意）
  - [x] `useChat.ts`
  - [x] `useSession.ts`

---

## Phase 8: エラーハンドリングとUX改善

### 8.1 エラーハンドリング
- [x] APIエラーの表示
  - [x] トースト通知またはエラーメッセージ
  - [x] ユーザーフレンドリーなエラー文言
- [x] ネットワークエラーのハンドリング
  - [x] 再試行機能（Sonner toastで実装）
  - [ ] オフライン検知（任意）

### 8.2 UX改善
- [x] ローディングインジケーター
  - [x] メッセージ送信中の表示
  - [x] 会話履歴読み込み中の表示
- [x] スケルトンUI
  - [x] ConversationListSkeleton - 会話一覧読み込み中
  - [x] MessageListSkeleton - メッセージ読み込み中
  - [x] ChatWindow で初回ローディング時にスケルトン表示
- [x] アニメーション追加（任意）
  - [x] メッセージのフェードイン（animate-bounce）
  - [x] スムーズなスクロール（scrollIntoView）

### 8.3 レスポンシブ対応
- [x] モバイル表示の確認
- [x] タブレット表示の確認
- [x] デスクトップ表示の確認

---

## Phase 9: テスト実装（Vitest）

### 9.1 ユニットテスト（lib）
- [x] `src/lib/session.ts` のテスト
  - [x] セッションID生成のテスト
  - [x] セッション取得/保存のテスト
- [x] `src/lib/claude.ts` のテスト（モック使用）
  - [x] API呼び出しのモック
  - [x] エラーハンドリングのテスト
- [x] `src/lib/prisma.ts` のテスト
  - [x] シングルトンパターンの検証

### 9.2 コンポーネントテスト（React Testing Library）
- [x] `components/chat/Message.tsx` のテスト
  - [x] ユーザーメッセージの表示
  - [x] AIメッセージの表示
  - [x] タイムスタンプの表示
- [x] `components/chat/MessageInput.tsx` のテスト
  - [x] テキスト入力
  - [x] 送信ボタンクリック
  - [x] Enterキーでの送信
  - [x] 空メッセージの送信防止
  - [x] 送信中の無効化状態
- [x] `components/chat/MessageList.tsx` のテスト
  - [x] メッセージ一覧の表示
  - [x] 空状態の表示
- [x] `components/chat/ChatWindow.tsx` のテスト
  - [x] 統合テスト（MessageList + MessageInput）
  - [x] ローディング状態の表示

### 9.3 API Routeテスト
- [x] `/api/chat` のテスト
  - [x] 正常なリクエストの処理
  - [x] バリデーションエラー
  - [x] SSEストリーミングのテスト
- [x] `/api/conversations` のテスト
  - [x] GET: 会話履歴の取得
  - [x] POST: 新規会話の作成
  - [x] エラーハンドリング

### 9.4 カスタムフックのテスト
- [x] `useChat` フックのテスト
  - [x] メッセージ送信
  - [x] 状態管理
- [x] `useSession` フックのテスト (SessionProvider)
  - [x] セッション初期化
  - [x] セッション永続化

### 9.5 E2Eテスト（Playwright - 任意）
- [x] Playwrightのセットアップ
  ```bash
  pnpm add -D @playwright/test
  npx playwright install
  ```
- [x] チャットフローのテスト
  - [x] メッセージ送信と表示
  - [x] ストリーミングレスポンスの確認
- [x] セッション管理のテスト
  - [x] 新規セッション作成
  - [x] セッション復元

### 9.6 手動テスト
- [x] チャット機能の動作確認
- [x] ストリーミング表示の確認
- [x] 会話履歴の保存・取得確認
- [x] エッジケースのテスト
  - [x] 長いメッセージ
  - [x] 特殊文字（絵文字、マークダウン）
  - [x] 連続送信
  - [x] ネットワークエラー時の挙動

---

## Phase 10: パフォーマンス最適化

### 10.1 フロントエンド最適化
- [x] コンポーネントのメモ化（React.memo, useMemo, useCallback）
  - Message, MessageList, MessageInput を React.memo でメモ化
  - MessageInput の handleSubmit, handleKeyDown を useCallback でメモ化
- [x] 画像最適化（Next.js Image）
  - このアプリでは画像を使用していないため不要
- [x] コード分割（dynamic import）
  - ChatWindow を next/dynamic で遅延読み込み
- [x] バンドルサイズの確認と最適化
  - ビルド成功、静的ページと動的APIルートが正しく構成

### 10.2 バックエンド最適化
- [x] データベースクエリの最適化
  - [x] インデックス設定
    - Conversation: sessionId インデックス追加
    - Message: conversationId + createdAt 複合インデックス追加
  - [x] N+1問題の解消
    - include を使用して関連データを1クエリで取得済み
- [x] Rate Limiting の実装
  - メモリベースのRate Limiter を実装（src/lib/rate-limit.ts）
  - チャットAPI: 1分あたり10リクエスト制限
- [x] キャッシュ戦略（必要に応じて）
  - 会話履歴は頻繁に変更、チャットAPIはストリーミングのためキャッシュ不要

---

## Phase 11: デプロイ準備（Raspberry Pi + GitHub Actions）

### 11.1 Dockerfile作成
- [x] `Dockerfile` を作成
  - マルチステージビルド (deps → builder → runner)
  - Node.js 22 Alpine ベース
  - standalone 出力モードで最適化
  - Prisma Client を含む
  - non-root ユーザーでセキュリティ確保
- [x] `.dockerignore` を作成
  - node_modules, .next, テストファイル等を除外
- [x] ローカルでDockerビルド確認
  ```bash
  docker build -t ai-chat .
  docker run -p 3000:3000 -e DATABASE_URL="..." -e ANTHROPIC_API_KEY="..." ai-chat
  ```

### 11.2 GitHub Actions ワークフロー作成
- [x] `.github/workflows/deploy.yml` を作成
  - main ブランチへの push 時にトリガー
  - QEMU + Buildx で ARM64 イメージをビルド
  - ghcr.io (GitHub Container Registry) へ push
  - キャッシュ設定でビルド高速化

### 11.3 Raspberry Pi 用 docker-compose 作成
- [x] `docker-compose.raspi.yml` を作成
  - ai-chat サービス（ghcr.io からイメージ取得）
  - Watchtower サービス（5分ごとにイメージ更新チェック）
  - ヘルスチェック設定

---

## Phase 12: Raspberry Pi デプロイ

### 12.1 Raspberry Pi セットアップ
- [x] ghcr.io への認証設定 
  ```bash
  # GitHub Personal Access Token (read:packages 権限) を作成
  echo $GITHUB_PAT | docker login ghcr.io -u USERNAME --password-stdin
  ```
- [x] docker-compose.yml と .env ファイルを配置
  ```bash
  # docker-compose.raspi.yml を docker-compose.yml にリネームしてコピー
  # .env ファイルに DATABASE_URL と ANTHROPIC_API_KEY を設定
  ```
- [x] Cloudflare Tunnel で localhost:3000 を公開
  ```bash
  # cloudflared config.yml に追加:
  # - hostname: chat.ryokino.com
  #   service: http://localhost:3000
  ```

### 12.2 初回デプロイ
- [x] コンテナを起動
  ```bash
  docker compose up -d
  ```
- [x] Watchtower のログ確認
  ```bash
  docker logs watchtower
  ```

### 12.3 本番環境での動作確認
- [x] Cloudflare Tunnel 経由でアクセス
- [x] チャット機能の動作確認
- [x] ストリーミングの動作確認
- [x] 会話履歴の保存確認
- [ ] 自動更新のテスト（main に push して5分後に反映されるか）

### 12.4 監視設定
- [x] docker logs でアプリログ確認
- [ ] Cloudflare Analytics でアクセス状況確認

---

## Phase 13: ドキュメント整備

### 13.1 README作成
- [x] `README.md` を作成
  - [x] プロジェクト概要
  - [x] セットアップ手順
  - [x] ローカル開発手順
  - [x] デプロイ手順
  - [x] 使用技術

### 13.2 コード内ドキュメント
- [x] 主要な関数にJSDocコメント追加
- [x] 複雑なロジックにコメント追加

### 13.3 API仕様書
- [x] OpenAPI/Swagger形式でAPI仕様を記述（docs/openapi.yaml）

---

## Phase 14: 会話管理機能（サイドバー）

### 14.1 データモデル変更
- [x] Conversation モデルに `title` フィールドを追加
- [x] Prisma Client を再生成（`npx prisma generate && npx prisma db push`）

### 14.2 API ルート変更・追加
- [x] `GET /api/conversations` を変更: 会話一覧を返す（現在は単一会話のみ）
- [x] `app/api/conversations/[id]/route.ts` を新規作成
  - [x] GET: 特定の会話とメッセージを取得
  - [x] DELETE: 会話を削除
  - [x] PATCH: タイトルを更新
- [x] `app/api/conversations/generate-title/route.ts` を新規作成
  - [x] POST: 最初のメッセージからAIでタイトルを自動生成
- [x] `/api/chat` を変更: `conversationId` パラメータを追加

### 14.3 shadcn/ui コンポーネント追加
- [x] 必要なコンポーネントをインストール
  ```bash
  npx shadcn@latest add sheet dropdown-menu dialog alert-dialog separator tooltip
  ```

### 14.4 サイドバーコンポーネント作成
- [x] `src/components/sidebar/AppSidebar.tsx` - サイドバー本体
- [x] `src/components/sidebar/ConversationList.tsx` - 会話リスト
- [x] `src/components/sidebar/ConversationItem.tsx` - 会話アイテム（編集・削除機能付き）
- [x] `src/components/sidebar/NewConversationButton.tsx` - 新規会話ボタン
- [x] shadcn/ui Sidebar コンポーネントでトグル機能を実装

### 14.5 レイアウトコンポーネント作成
- [x] `src/components/layout/AppLayout.tsx` - サイドバー + メインコンテンツのレイアウト
- [x] `src/components/ConversationProvider.tsx` - 会話状態管理のContext

### 14.6 カスタムフック作成・更新
- [x] `src/hooks/useConversations.ts` を新規作成
  - 会話一覧の取得・作成・削除・タイトル更新
- [x] `src/hooks/useChat.ts` を変更
  - `conversationId` パラメータ対応

### 14.7 SSEクライアント更新
- [x] `src/lib/sse-client.ts` に追加
  - `fetchConversations()` - 会話一覧取得
  - `fetchConversation()` - 単一会話取得
  - `deleteConversation()` - 会話削除
  - `updateConversationTitle()` - タイトル更新
  - `generateConversationTitle()` - タイトル自動生成

### 14.8 ページ・レイアウト更新
- [x] `app/page.tsx` を変更 - AppLayout統合
- [x] `app/layout.tsx` を変更 - ConversationProvider追加

### 14.9 レスポンシブデザイン実装
- [x] デスクトップ: サイドバー常時表示（折りたたみ可能、幅280px/60px）
- [x] モバイル: ハンバーガーメニュー（Sheetで左からスライド）

### 14.10 タイトル自動生成機能
- [x] 最初のメッセージ送信後にタイトルを自動生成
- [x] 生成プロンプトはメッセージと同じ言語でタイトルを生成

### 14.11 テスト
- [x] コンポーネントテスト（ChatWindow, useChat, conversations/route, chat/route）
- [x] APIテスト（conversations/[id], generate-title）
- [x] E2Eテスト（会話作成・切替・削除確認ダイアログ・タイトル編集）
  - Playwright MCP で実施完了

---

## Phase 15: 追加機能

### 15.0 UI改善
- [x] デスクトップ用サイドバートグルボタン追加

### 15.1 ダークモード
- [x] next-themes のセットアップ
- [x] テーマ切り替えボタン追加

### 15.2 AI設定（グローバル）
- [x] 設定の型定義と保存/読み込み機能（localStorage）
  - `src/lib/settings.ts` - 型定義、デフォルト値、localStorage関数
- [x] システムプロンプトのカスタマイズ
  - デフォルト: 医学教育向け、ソクラテス式問答、厳しい先生キャラ
- [x] レスポンス長の設定（max_tokens: 1024 / 2048 / 4096）
- [x] Temperature の設定（0.0 - 1.0、デフォルト: 0.3）
- [x] 設定ダイアログUI（shadcn/ui Dialog）
  - `src/components/settings/SettingsDialog.tsx`
- [x] 設定管理フック
  - `src/hooks/useSettings.ts`
- [x] APIルートに設定を反映
  - `src/app/api/chat/route.ts` - リクエストから設定を受け取りMastraに渡す
  - `src/lib/sse-client.ts` - 設定を送信
  - `src/hooks/useChat.ts` - 設定を渡す
- [x] テスト作成
  - [x] `src/lib/settings.test.ts` - 設定の保存/読み込みテスト
  - [x] `src/hooks/useSettings.test.ts` - フックのテスト
  - [x] `src/components/settings/SettingsDialog.test.tsx` - UIコンポーネントテスト

### 15.3 メッセージ編集・再生成
- [x] ユーザーメッセージの編集機能
  - `src/components/chat/Message.tsx` - 編集ボタン・編集UI追加
  - `src/hooks/useChat.ts` - editMessage関数追加
- [x] AIレスポンスの再生成機能
  - `src/components/chat/Message.tsx` - 再生成ボタン追加
  - `src/hooks/useChat.ts` - regenerateMessage関数追加
- [x] メッセージ削除API
  - `src/app/api/messages/[id]/route.ts` - DELETE API（deleteAfterオプション付き）
  - `src/lib/sse-client.ts` - deleteMessage関数追加
- [x] テスト作成
  - `src/app/api/messages/[id]/route.test.ts` - APIテスト（6件）

---

## Phase 16: Web検索機能

- [x] 検索API選定（Tavily）
  - `@tavily/core` SDKを使用
  - 環境変数 `TAVILY_API_KEY` で設定
- [x] ツール呼び出し（Function Calling）実装
  - `src/lib/tools/webSearchTool.ts` - Mastra用ツール定義
  - `webSearchTool` - 一般的なWeb検索
  - `medicalSearchTool` - 医療専門検索（信頼できる医療ドメインを優先）
  - `src/lib/mastra.ts` - エージェントにツール統合
- [x] UI統合
  - `src/components/chat/Message.tsx` - 検索ソース表示（参考ソースとしてリンク表示）
  - `src/lib/sse-client.ts` - 検索ソースの受信処理
  - `src/hooks/useChat.ts` - ソース情報のメッセージへの付与
  - `src/app/api/chat/route.ts` - fullStreamでツール結果をキャプチャ
- [x] テスト作成
  - `src/lib/tools/webSearchTool.test.ts` - ツールのユニットテスト
  - `src/app/api/chat/route.test.ts` - fullStream対応に更新

---

## Phase 17: Mastra型定義対応

### 17.1 型定義変更対応
- [x] `src/app/api/chat/route.ts` の修正
  - `chunk.textDelta` → `chunk.payload.text` に変更（182-183行目）
  - `chunk.result` → `chunk.payload.result` に変更（187行目）
- [x] `src/app/api/chat/route.test.ts` のモック修正
  - 全てのモックストリームを新しい構造に変更（5箇所）
  - `{ type: "text-delta", textDelta: "..." }` 
    → `{ type: "text-delta", payload: { id: "...", text: "..." } }`
- [x] ビルド確認
  - `pnpm build` でTypeScriptエラーが解消されることを確認
  - `pnpm test:run` で全テストが通ることを確認（118テスト全て通過）
- [x] Dockerビルド確認
  - `docker build -t ai-chat .` でビルドが成功することを確認

**背景:**
Mastra (`@mastra/core@^0.24.6`) の型定義が変更され、ストリーミングチャンクの構造が変わりました。`chunk.textDelta` から `chunk.payload.text` へ、`chunk.result` から `chunk.payload.result` への変更が必要でした。

---

## Phase 18: 再生成機能の400エラー修正

### 18.1 原因
- `SessionProvider` の初期状態が `sessionId: ""`
- `useEffect` で localStorage から読み込む前に操作すると空の sessionId で API が呼ばれる
- 特にiOS Safariでタイミング問題が発生しやすい

### 18.2 修正
- [x] `src/hooks/useChat.ts` に sessionLoading チェック追加
- [x] `src/components/ConversationProvider.tsx` で isLoading を伝播
- [x] `src/components/chat/ChatWindow.tsx` で sessionLoading を渡す
- [x] テスト: sessionLoading=true 時にAPIが呼ばれないこと
- [x] Playwright E2Eテスト: 再生成機能の確認

---

## Phase 19: 認証機能（Better Auth + Google OAuth）

### 19.1 セットアップ
- [x] `pnpm add better-auth` インストール
- [x] 環境変数設定（BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET）
- [x] Google Cloud Console で OAuth クライアント作成

### 19.2 Better Auth 設定
- [x] `src/lib/auth.ts` 作成（Better Auth サーバー設定）
  - [x] 環境に応じてbaseURLを自動設定する関数追加
- [x] `src/lib/auth-client.ts` 作成（クライアント設定）
- [x] `src/app/api/auth/[...all]/route.ts` 作成（APIルート）

### 19.3 Prisma スキーマ更新
- [x] User, Session, Account, Verification モデル追加
- [x] Conversation モデルに userId フィールド追加
- [x] `npx prisma generate && npx prisma db push`

### 19.4 SessionProvider 統合
- [x] `src/components/SessionProvider.tsx` を Better Auth と統合
- [x] 認証済み: userId を使用
- [x] 未認証: localStorage の sessionId を使用（後方互換）

### 19.5 API ルート更新
- [x] `src/app/api/chat/route.ts` - userId 対応
- [x] `src/app/api/conversations/route.ts` - userId 対応
- [x] `src/app/api/conversations/[id]/route.ts` - userId 対応
- [x] `src/lib/sse-client.ts` - 全関数を userId 対応
- [x] `src/hooks/useConversations.ts` - userId パラメータ追加
- [x] `src/hooks/useChat.ts` - userId パラメータ追加
- [x] `src/components/ConversationProvider.tsx` - userId を伝播
- [x] `src/components/chat/ChatWindow.tsx` - userId を useChat に渡す

### 19.6 認証 UI
- [x] `src/components/auth/AuthButton.tsx` 作成
- [x] `src/components/auth/UserMenu.tsx` 作成
- [x] `src/components/sidebar/AppSidebar.tsx` に認証UI追加

### 19.7 テスト
- [x] ユニットテスト: AuthButton, UserMenu (11/11 passed)
- [x] E2Eテスト: Google OAuth フロー（chrome-devtools-mcp）
- [ ] Playwright E2Eテスト: 認証後のデバイス間同期確認

### 19.8 環境変数・設定ファイル更新
- [x] `.env.example` 更新 - BETTER_AUTH_URLをオプションに
- [x] `docker-compose.raspi.yml` 更新 - 本番環境用環境変数追加
- [x] `.env.local` 更新 - BETTER_AUTH_URL削除（自動取得）
- [x] `Makefile` 作成 - 開発コマンドを簡素化

### 19.9 Raspberry Pi デプロイ準備（@ryokino 手動作業）
> **⚠️ デプロイ前に以下の作業が必要です！**

- [x] **@ryokino**: Raspberry Pi の `/path/to/ai-chat/.env` ファイルに以下を追加:
  ```env
  BETTER_AUTH_SECRET=（開発環境と同じ値）
  GOOGLE_CLIENT_ID=（開発環境と同じ値）
  GOOGLE_CLIENT_SECRET=（開発環境と同じ値）
  TAVILY_API_KEY=（開発環境と同じ値）
  ```
- [x] **@ryokino**: Raspberry Pi で docker compose を再起動:
  ```bash
  cd /path/to/ai-chat
  docker compose down
  docker compose up -d
  ```
- [x] **@ryokino**: Google Cloud Console で本番環境のリダイレクトURIを追加:
  - `https://chat.ryokino.com/api/auth/callback/google`

### 19.10 バグ修正
- [x] `src/components/SessionProvider.tsx` - SessionContextType に user プロパティを追加
  - UserMenu.tsx が user を使用するため必須
  - authSession?.user を Context で公開する
  - Better Authの型推論を使用して型安全に実装
  - AuthButton, UserMenu のテスト修正（user型にcreatedAt, updatedAt, emailVerifiedを追加）

### 19.11 APIルート userId 対応完了
- [x] `src/app/api/messages/[id]/route.ts` - userId 対応
  - sessionId または userId のいずれかが必須に変更
  - 所有権検証をuserId対応に修正
  - 認証ユーザーのメッセージ編集/再生成が動作するように修正
- [x] `src/app/api/conversations/generate-title/route.ts` - userId 対応
  - sessionId または userId のいずれかが必須に変更
  - 会話取得クエリをuserId対応に修正
  - 認証ユーザーのタイトル自動生成が動作するように修正

---

## Phase 20: テスト拡充

### 20.1 APIルートテスト
- [x] `src/app/api/conversations/[id]/route.test.ts` 作成 (10テストケース)
  - GET: sessionIdで会話取得 (status=200, messages含む)
  - GET: userIdで会話取得 (status=200, messages含む)
  - GET: sessionId/userId両方なし (status=400)
  - GET: 存在しない会話 (status=404)
  - GET: 他人の会話にアクセス (status=404, 認可エラー)
  - PATCH: タイトル更新成功 (status=200, 更新後タイトル)
  - PATCH: titleが文字列でない (status=400)
  - PATCH: sessionId/userId両方なし (status=400)
  - DELETE: 会話削除成功 (status=200, prisma.message.deleteManyが先)
  - DELETE: sessionId/userId両方なし (status=400)
- [x] `src/app/api/conversations/generate-title/route.test.ts` 作成 (7テストケース)
  - POST: タイトル生成成功 (status=200, Claude APIで生成)
  - POST: 既存タイトルあり (status=200, Claude API呼ばれない)
  - POST: conversationIdなし (status=400)
  - POST: sessionId/userId両方なし (status=400)
  - POST: 会話が見つからない (status=404)
  - POST: メッセージがない (status=400)
  - POST: 長いタイトルは50文字に切り詰め (titleが50文字以下)
- [x] 既存APIテストの更新
  - `src/app/api/chat/route.test.ts`: userIdパラメータテスト追加、sessionId/userId両方なしケース追加
  - `src/app/api/conversations/route.test.ts`: GET/POSTでuserIdテスト追加

### 20.2 ライブラリテスト
- [x] `src/lib/rate-limit.test.ts` 作成 (6テストケース)
  - checkRateLimit: 初回リクエスト (success=true, remaining=maxRequests-1)
  - checkRateLimit: 制限内リクエスト (success=true, remaining減少)
  - checkRateLimit: 制限超過 (success=false, remaining=0)
  - checkRateLimit: 異なるidentifier (独立カウント)
  - checkRateLimit: ウィンドウ経過後 (リセット確認)
  - getRateLimitHeaders: 正常値 (X-RateLimit-Remaining, X-RateLimit-Reset)
- [x] `src/lib/sse-client.test.ts` 作成 (11テストケース)
  - processSSEStream: contentチャンク受信 (onMessage呼び出し確認)
  - processSSEStream: conversationInfo受信 (onConversationInfo呼び出し)
  - processSSEStream: searchSources受信 (onSearchSources呼び出し)
  - processSSEStream: [DONE]受信 (onComplete呼び出し)
  - processSSEStream: HTTPエラー (onError呼び出し)
  - sendChatMessage: 正常リクエスト (fetchが正しいbodyで呼ばれる)
  - sendChatMessage: settings付き (settingsがbodyに含まれる)
  - fetchConversations: sessionIdで取得 (クエリパラメータ確認)
  - fetchConversations: userIdで取得 (userIdが優先される)
  - fetchConversations: エラーレスポンス (Errorをthrow)
  - deleteMessage: deleteAfter=true (deleteAfterがbodyに含まれる)
- [x] `src/lib/auth.test.ts` 作成（任意 - スキップ）
  - getBaseURLは内部関数のためテスト困難、優先度低

### 20.3 フックテスト
- [x] `src/hooks/useConversations.test.ts` 作成 (11テストケース)
  - 初期化時にfetchConversations呼び出し (マウント時API呼び出し)
  - userIdがある場合はuserIdで呼び出し (userIdを優先)
  - createNewConversation (呼び出し確認、リスト追加、activeId設定)
  - createNewConversation: sessionId/userIdなし (nullを返す)
  - deleteConversation (呼び出し確認、リストから削除)
  - deleteConversation: アクティブな会話を削除 (別の会話をアクティブに)
  - updateTitle (呼び出し確認、ローカル状態更新)
  - generateTitle (呼び出し確認、ローカル状態更新)
  - refetch (fetchConversations再呼び出し)
  - エラーハンドリング (error状態設定)
  - clearError (error=null)

### 20.4 コンポーネントテスト
- [x] `src/components/ConversationProvider.test.tsx` 作成 (4テストケース)
  - Provider: 子要素をレンダリング (childrenがDOMに存在)
  - Provider: useSessionの値を伝播 (sessionId, userId, isLoadingが取得可能)
  - Provider: useConversationsの値を伝播 (conversations, functionsが取得可能)
  - useConversation: Provider外で使用 (エラーをthrow)
- [x] サイドバーコンポーネントテスト（任意 - スキップ）
  - AppSidebar.tsx, ConversationList.tsx, ConversationItem.tsx, NewConversationButton.tsx
  - E2Eテストで既にカバー済みのため優先度低

---

## Phase 21: セキュリティ強化とコード品質改善

### 21.1 デバッグログ削除
- [x] `src/hooks/useChat.ts:213` の `console.log("Message streaming completed")` を削除

### 21.2 サーバーサイド認証検証
- [x] `src/lib/auth.ts` に `getAuthenticatedUserId()` ヘルパー関数を追加
- [x] `src/app/api/chat/route.ts` に認証検証を追加
- [x] `src/app/api/conversations/route.ts` に認証検証を追加
- [x] `src/app/api/conversations/[id]/route.ts` に認証検証を追加
- [x] `src/app/api/messages/[id]/route.ts` に認証検証を追加
- [x] `src/app/api/conversations/generate-title/route.ts` に認証検証を追加

### 21.3 Error Boundary
- [x] `src/components/ErrorBoundary.tsx` を作成
- [x] `src/app/layout.tsx` に ErrorBoundary を統合
- [x] `src/components/__tests__/ErrorBoundary.test.tsx` を作成

### 21.4 テスト
- [x] `src/lib/__tests__/auth.test.ts` を作成
  - `getAuthenticatedUserId()` のテスト
  - `getBaseURL()` のテスト
- [x] 各APIルートテストの更新（認証検証のテストケース追加）
  - `src/app/api/chat/route.test.ts` - userId不一致時の403テスト
  - `src/app/api/conversations/route.test.ts` - userId不一致時の403テスト
  - `src/app/api/messages/[id]/route.test.ts` - userId不一致時の403テスト

---

## Phase 22: マルチモーダル対応 - 画像添付機能

### 22.1 データモデル拡張
- [x] Prisma schema に `attachments` フィールドを追加
  - Message モデルに `attachments Json?` を追加
- [x] 型定義ファイルの作成
  - `src/types/attachment.ts` - ImageAttachment 型定義
  - サポート形式: JPEG, PNG, WebP, GIF
  - 最大サイズ: 5MB

### 22.2 画像バリデーションとアップロード
- [x] `src/lib/image-validation.ts` を作成
  - ファイル形式・サイズバリデーション
  - Base64変換ユーティリティ
  - 画像寸法取得
- [x] `src/app/api/upload/image/route.ts` を作成
  - 画像バリデーションエンドポイント

### 22.3 フロントエンド UI
- [x] `src/components/chat/MessageInput.tsx` を更新
  - 画像添付ボタン追加
  - 画像プレビュー表示
  - ドラッグ&ドロップ対応
  - クリップボード貼り付け対応
  - 複数画像対応
- [x] `src/components/chat/Message.tsx` を更新
  - 添付画像の表示
  - 画像クリックで拡大表示（ダイアログ）
  - 画像ホバーでファイル名表示

### 22.4 Claude API 統合
- [x] `src/lib/claude-multimodal.ts` を作成
  - ImageAttachment → Claude API 形式への変換
  - マルチモーダルメッセージ変換ユーティリティ
- [x] `src/app/api/chat/route.ts` を更新
  - attachments パラメータ対応
  - 会話履歴のマルチモーダル対応
  - Claude API へのマルチモーダルメッセージ送信

### 22.5 データベース保存とフロントエンド統合
- [x] メッセージ保存時に attachments を保存
- [x] `src/lib/sse-client.ts` を更新
  - Message 型に attachments を追加
  - sendChatMessage に attachments パラメータ追加
- [x] `src/hooks/useChat.ts` を更新
  - sendMessage に attachments パラメータ追加
  - 会話履歴読み込み時に attachments を復元
  - ユーザーメッセージ表示時に attachments を表示

### 22.6 Prisma マイグレーション
- [ ] Prisma Client を再生成
  ```bash
  npx prisma generate
  ```
- [ ] データベースにスキーマをプッシュ
  ```bash
  npx prisma db push
  ```

### 22.7 テスト（今後追加予定）
- [ ] 画像バリデーションのユニットテスト
- [ ] 画像アップロードAPIのテスト
- [ ] MessageInput コンポーネントのテスト
- [ ] Message コンポーネントの画像表示テスト
- [ ] E2Eテスト - 画像添付→送信→表示フロー

### 22.8 ドキュメント
- [ ] README.md に画像添付機能の説明を追加
- [ ] CLAUDE.md の更新（必要に応じて）

---

## Phase 23: 本番環境ログインバグ修正

### 23.1 問題
- 本番環境 (https://chat.ryokino.com) でログインボタンをクリックしても動作しない
- Better Auth の `/api/auth/get-session` が `http://localhost:3000` にアクセスしていた
- CORSエラーが発生: `Permission was denied for this request to access the 'unknown' address space`

### 23.2 原因
- `NEXT_PUBLIC_APP_URL` がビルド時に設定されていなかった
- `src/lib/auth-client.ts` でデフォルト値 `http://localhost:3000` が埋め込まれた
- Docker イメージビルド時に環境変数が渡されていなかった

### 23.3 修正内容
- [x] Dockerfile を修正 - `ARG NEXT_PUBLIC_APP_URL` を追加し、ENV として設定
- [x] GitHub Actions を修正 - build-args に `NEXT_PUBLIC_APP_URL=https://chat.ryokino.com` を追加
- [x] docker-compose.raspi.yml を修正 - ランタイム環境変数から削除（コメント追加）

### 23.4 デプロイ
- [ ] コミット & プッシュ
- [ ] GitHub Actions でビルド完了を確認
- [ ] Raspberry Pi で Watchtower による自動更新を確認（約5分）
- [ ] 本番環境でログイン機能をテスト

---

## チェックリスト完了後

- [ ] 全機能の最終動作確認
- [ ] セキュリティチェック
- [ ] パフォーマンステスト
- [ ] ユーザーフィードバック収集
- [ ] 改善点のリストアップ

---

## 注意事項

### 開発中の留意点
- コミットは小さく、頻繁に行う
- 機能ごとにブランチを作成（Git Flow推奨）
- コードレビューを実施（可能であれば）
- CLAUDE.mdの「テストコード作成時の厳守事項」を遵守
- 意味のないテストは書かない
- ハードコーディング禁止

### トラブルシューティング
- Prismaの接続エラー → DATABASE_URLを確認
- SSEが動作しない → ブラウザのコンソールエラーを確認
- デプロイエラー → Cloud Runのログを確認
- APIキーエラー → Secret Managerの設定を確認

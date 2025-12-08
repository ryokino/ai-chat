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
- [ ] スケルトンUI（任意）
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
- [ ] `src/lib/claude.ts` のテスト（モック使用）
  - [ ] API呼び出しのモック
  - [ ] エラーハンドリングのテスト
- [ ] `src/lib/prisma.ts` のテスト
  - [ ] シングルトンパターンの検証

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

## Phase 11: デプロイ準備

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
  ※ Docker Daemon起動が必要

### 11.2 Google Cloud設定
- [x] GCPプロジェクトを作成
- [ ] gcloud CLIのインストールと認証 ([userメモ] プロジェクトid: ai-chat-with-cc, プロジェクト 番号: 692287575404)
  ```bash
  gcloud auth login
  gcloud config set project [PROJECT_ID]
  ```
- [ ] Artifact Registryのセットアップ
  ```bash
  gcloud artifacts repositories create ai-chat-repo --repository-format=docker --location=asia-northeast1
  ```

### 11.3 環境変数とシークレット管理
- [ ] Secret Managerで環境変数を設定
  ```bash
  echo -n "your-api-key" | gcloud secrets create anthropic-api-key --data-file=-
  ```
- [ ] Cloud Runサービスアカウントの権限設定

---

## Phase 12: デプロイ

### 12.1 初回デプロイ
- [ ] イメージをビルドしてArtifact Registryにプッシュ
  ```bash
  gcloud builds submit --tag asia-northeast1-docker.pkg.dev/[PROJECT_ID]/ai-chat-repo/ai-chat
  ```
- [ ] Cloud Runにデプロイ
  ```bash
  gcloud run deploy ai-chat \
    --image asia-northeast1-docker.pkg.dev/[PROJECT_ID]/ai-chat-repo/ai-chat \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated
  ```
- [ ] 環境変数を設定
  ```bash
  gcloud run services update ai-chat \
    --update-secrets=ANTHROPIC_API_KEY=anthropic-api-key:latest \
    --set-env-vars DATABASE_URL=[MONGODB_URL]
  ```

### 12.2 本番環境での動作確認
- [ ] デプロイされたURLにアクセス
- [ ] チャット機能の動作確認
- [ ] ストリーミングの動作確認
- [ ] 会話履歴の保存確認
- [ ] エラーログの確認（Cloud Logging）

### 12.3 監視とアラート設定
- [ ] Cloud Monitoringでメトリクス確認
- [ ] エラーレートのアラート設定
- [ ] コスト監視の設定

---

## Phase 13: ドキュメント整備

### 13.1 README作成
- [ ] `README.md` を作成
  - [ ] プロジェクト概要
  - [ ] セットアップ手順
  - [ ] ローカル開発手順
  - [ ] デプロイ手順
  - [ ] 使用技術

### 13.2 コード内ドキュメント
- [ ] 主要な関数にJSDocコメント追加
- [ ] 複雑なロジックにコメント追加

### 13.3 API仕様書
- [ ] OpenAPI/Swagger形式でAPI仕様を記述

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

## Phase 15: 追加機能（オプション）

### 15.1 設定機能
- [ ] AIのパーソナリティ設定
- [ ] レスポンス長の設定
- [ ] テーマ切り替え（ライト/ダーク）

### 15.2 エクスポート機能
- [ ] 会話履歴のJSON/Markdownエクスポート
- [ ] 会話履歴のPDFエクスポート

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

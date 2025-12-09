# AI Chat Bot - 仕様書

## プロジェクト概要

### 目的
- エンターテイメント向けAIチャットボット
- ユーザーがAIと自由に雑談・フリートークを楽しめるアプリケーション

### ターゲット体験
- 気軽にAIと会話を楽しむ
- 会話履歴を保存して過去のやり取りを振り返る
- リアルタイムでストリーミングレスポンスを体験

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **UIライブラリ**: shadcn/ui (Tailwind CSS + Radix UI)
- **スタイリング**: Tailwind CSS

### バックエンド
- **フレームワーク**: Next.js App Router (API Routes) + Hono
- **言語**: TypeScript
- **ORM**: Prisma.js
- **APIフレームワーク**: Hono (高速で軽量なAPIサーバー)

### AI/エージェント
- **LLM**: Claude (Anthropic)
- **AIフレームワーク**: Mastra
- **APIクライアント**: @anthropic-ai/sdk

### データベース
- **データベース**: MongoDB Atlas
- **クライアント**: Prisma Client (MongoDB connector)

### 認証
- **ライブラリ**: Better Auth
- **認証方式**: Google OAuth 2.0
- **セッション管理**: サーバーサイドセッション（MongoDB保存）

### デプロイ
- **プラットフォーム**: Raspberry Pi (自宅サーバー)
  - Cloudflare Tunnel 経由で外部公開
  - GitHub Actions + Watchtower で自動デプロイ

---

## 主要機能

### 1. リアルタイムチャット
- **実装方法**: Server-Sent Events (SSE)
- Claude APIのストリーミング機能を使用
- ユーザーがメッセージを送信すると、AIが逐次的にレスポンスを返す
- リアルタイムで文字が表示される体験

### 2. 会話履歴の保存
- すべての会話をMongoDBに保存
- セッションベースで会話を管理（認証なしのため、セッションIDで識別）
- 会話の取得・表示機能

### 3. シンプルなUI/UX
- ビジネスライクでクリーンなデザイン
- shadcn/uiのコンポーネントを活用
- レスポンシブデザイン対応

### 4. 会話管理機能
- サイドバーで複数の会話を管理
- 新規会話の作成・既存会話の選択
- 会話タイトルの自動生成（AIによる）と手動編集
- 会話の削除（確認ダイアログ付き）
- レスポンシブ対応（デスクトップ：折りたたみ可能、モバイル：ハンバーガーメニュー）

---

## 認証・セキュリティ

### 認証
- **ライブラリ**: Better Auth
- **認証方式**: Google OAuth 2.0
- **後方互換**: 未認証ユーザーはlocalStorageのセッションIDで利用可能

### セッション管理
- **認証済みユーザー**: Better AuthのサーバーサイドセッションでuserIdを管理
- **未認証ユーザー**: 初回アクセス時にセッションIDを生成、localStorageに保存
- 会話データはuserId（認証済み）またはsessionId（未認証）に紐づけ

---

## データモデル

### User (ユーザー)
```prisma
model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  conversations Conversation[]
}
```

### Session (認証セッション)
```prisma
model Session {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Account (OAuth アカウント)
```prisma
model Account {
  id                String  @id @default(auto()) @map("_id") @db.ObjectId
  userId            String  @db.ObjectId
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([providerId, accountId])
}
```

### Conversation (会話)
```prisma
model Conversation {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionId String?  @db.String  // 匿名セッション用（後方互換）
  userId    String?  @db.ObjectId  // 認証ユーザー用
  user      User?    @relation(fields: [userId], references: [id])
  title     String?  @db.String
  messages  Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sessionId])
  @@index([userId])
}
```

### Message (メッセージ)
```prisma
model Message {
  id             String       @id @default(auto()) @map("_id") @db.ObjectId
  conversationId String       @db.ObjectId
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           String       // "user" or "assistant"
  content        String
  createdAt      DateTime     @default(now())
}
```

---

## アーキテクチャ

### ディレクトリ構成（推奨）
```
ai-chat/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # SSEストリーミングエンドポイント
│   │   └── conversations/
│   │       └── route.ts          # 会話履歴取得API
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # メインチャットページ
├── components/
│   ├── ui/                       # shadcn/uiコンポーネント
│   ├── chat/
│   │   ├── ChatWindow.tsx        # チャット画面
│   │   ├── MessageList.tsx       # メッセージリスト
│   │   ├── MessageInput.tsx      # メッセージ入力欄
│   │   └── Message.tsx           # 個別メッセージ
│   └── SessionProvider.tsx       # セッション管理
├── lib/
│   ├── prisma.ts                 # Prismaクライアント
│   ├── claude.ts                 # Claude API設定
│   └── mastra.ts                 # Mastraエージェント設定
├── prisma/
│   └── schema.prisma             # Prismaスキーマ
├── .env.local                    # 環境変数
└── package.json
```

### データフロー

#### チャットメッセージ送信
1. ユーザーがメッセージを入力
2. フロントエンド → `/api/chat` (POST) にメッセージ送信
3. バックエンドがセッションIDを取得・検証
4. Mastra経由でClaude APIにリクエスト
5. SSEでストリーミングレスポンスを返す
6. メッセージをMongoDBに保存
7. フロントエンドでリアルタイム表示

#### 会話履歴取得
1. フロントエンドがセッションIDを送信
2. `/api/conversations` (GET) にリクエスト
3. セッションIDに紐づく会話履歴を取得
4. フロントエンドに返却・表示

---

## リアルタイム通信の実装

### Server-Sent Events (SSE) の採用理由
- Claude APIがストリーミングをサポート
- 実装がシンプル（WebSocketより軽量）
- サーバー→クライアントの一方向通信で十分

### SSE実装例（概要）
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Claude APIからストリーミング取得
      const response = await claude.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 1024,
      });

      for await (const chunk of response) {
        // SSE形式でデータ送信
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 環境変数

```.env
# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# MongoDB
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/ai-chat?retryWrites=true&w=majority"

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session (レガシー: 未認証ユーザー用)
SESSION_SECRET=your_random_secret_key

# Better Auth (認証)
BETTER_AUTH_SECRET=your_random_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Tavily (Web検索)
TAVILY_API_KEY=your_tavily_api_key
```

---

## デプロイ

### デプロイアーキテクチャ
```
[GitHub main branch push]
        ↓
[GitHub Actions]
  - ARM64 Docker イメージビルド
  - ghcr.io へ push
        ↓
[Raspberry Pi - Watchtower]
  - 5分ごとにイメージ更新チェック
  - 新イメージがあれば自動 pull & 再起動
        ↓
[Cloudflare Tunnel]
  - 外部公開（ポート開放不要）
```

### Raspberry Pi デプロイ手順
1. `docker-compose.raspi.yml` を Raspi にコピー
2. `.env` ファイルに環境変数を設定
3. ghcr.io に認証: `docker login ghcr.io`
4. `docker compose up -d` で起動

### 必要なサービス
- GitHub Container Registry (イメージホスティング)
- Cloudflare Tunnel (外部公開)
- MongoDB Atlas (データベース)

---

## 開発ロードマップ

### Phase 1: 基本セットアップ
- [ ] Next.js + TypeScript プロジェクト作成
- [ ] Tailwind CSS + shadcn/ui セットアップ
- [ ] Prisma + MongoDB Atlas 接続設定
- [ ] Claude API クライアント設定
- [ ] Mastra セットアップ

### Phase 2: コア機能実装
- [ ] チャットUI作成（MessageList, MessageInput）
- [ ] SSEストリーミング機能実装
- [ ] セッション管理機能
- [ ] 会話履歴の保存・取得

### Phase 3: UI/UX改善
- [ ] レスポンシブデザイン対応
- [ ] ローディング状態の表示
- [ ] エラーハンドリング

### Phase 4: デプロイ
- [ ] Dockerfileの作成
- [ ] Google Cloud Runへデプロイ
- [ ] 本番環境での動作確認

---

## 開発ワークフロー

### タスク管理
- **TODO管理**: `TODO.md` ファイルで全タスクを管理
- **進捗の記録**: 実装が完了したタスクは、必ず `TODO.md` のチェックボックスにチェック `[x]` を入れること
- **TodoWriteツール**: Claude Codeの TodoWrite ツールを使って、現在作業中のタスクを追跡すること
- **コミット前**: 各機能実装後、必ずTODO.mdを更新してからコミット

### 実装の進め方
1. TODO.mdから次に実装するタスクを選択
2. TodoWriteツールでタスクを `in_progress` に設定
3. 実装を行う
4. テストを実施（該当する場合）
5. 実装が完了したら、TodoWriteツールでタスクを `completed` に設定
6. TODO.mdの該当チェックボックスを `[x]` に更新
7. **必ずGitコミットを行う**（重要！）

### Git コミットルール
- **実装完了後は必ずコミット**: 各Phase、各機能の実装が完了したら、必ずGitにコミットすること
- **コミットのタイミング**:
  - 1つのPhaseが完了したとき
  - 1つの機能が完了したとき
  - 複数のファイルにまたがる大きな変更が完了したとき
- **コミットメッセージの形式**:
  ```
  feat/fix/refactor: 簡潔なタイトル

  - 変更内容の詳細1
  - 変更内容の詳細2
  - 変更内容の詳細3

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```
- **コミット前の確認**:
  - TODO.mdのチェックボックスを更新済みか
  - `pnpm lint` でエラーがないか
  - 必要に応じて `pnpm test` でテストが通るか

### 品質チェック
- テストコード作成時は、グローバルCLAUDE.mdの「テストコード作成時の厳守事項」を必ず遵守
- 意味のないテスト（`expect(true).toBe(true)`など）は絶対に書かない
- テストを通すためだけのハードコーディングは禁止

### UIコンポーネントのルール
- **shadcn/uiコンポーネントは直接編集しない**: `src/components/ui/`内のshadcn/uiコンポーネントを直接編集しない
- **wrapperコンポーネントを作成する**: UIをカスタマイズする場合は、`src/components/`配下にwrapperコンポーネントを作成して使用する
- **テストを書く**: UIコンポーネントには必ずテストを追加する

---

## 注意事項

### セキュリティ
- 認証がないため、セッションIDの推測攻撃に注意
- Rate Limiting の実装を検討
- 不適切なコンテンツフィルタリングを検討

### コスト管理
- Claude API使用量の監視
- MongoDB Atlas の無料枠内での運用
- Google Cloud Runの料金監視

### パフォーマンス
- SSE接続の適切なタイムアウト設定
- データベースクエリの最適化
- 会話履歴の取得件数制限

---

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma MongoDB](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Mastra Documentation](https://mastra.ai/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Better Auth Documentation](https://www.better-auth.com/docs)

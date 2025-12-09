# AI Chat Bot

エンターテイメント向けAIチャットボットアプリケーション。Claude (Anthropic) を使用したリアルタイムストリーミング対話を提供します。

## 機能

- **リアルタイムチャット**: Server-Sent Events (SSE) によるストリーミングレスポンス
- **会話管理**: サイドバーから複数会話の作成・切替・削除が可能
- **タイトル自動生成**: AIが会話内容からタイトルを自動生成
- **会話履歴保存**: MongoDB Atlasにすべての会話を永続化
- **レスポンシブUI**: デスクトップ・モバイル両対応

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| UIライブラリ | shadcn/ui, Radix UI, Tailwind CSS |
| AI/LLM | Claude (Anthropic), Mastra |
| データベース | MongoDB Atlas + Prisma ORM |
| テスト | Vitest, React Testing Library, Playwright |
| デプロイ | Docker, GitHub Actions, Raspberry Pi |

## セットアップ

### 必要条件

- Node.js 22+
- pnpm 10+
- MongoDB Atlas アカウント
- Anthropic API キー

### 環境変数

`.env.local` ファイルを作成し、以下を設定:

```env
# Claude API
ANTHROPIC_API_KEY=your_api_key_here

# MongoDB Atlas
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai-chat?retryWrites=true&w=majority"

# アプリケーション
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=your_random_secret_key
```

### インストール

```bash
# 依存関係のインストール
pnpm install

# Prisma Clientの生成
npx prisma generate

# データベースのセットアップ
npx prisma db push
```

## ローカル開発

```bash
# 開発サーバーを起動
pnpm dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

### テスト

```bash
# ユニットテスト実行
pnpm test:run

# テストをウォッチモードで実行
pnpm test

# E2Eテスト実行
npx playwright test
```

### Lint / Format

```bash
# Biomeでコードチェックと自動修正
pnpm lint

# フォーマットのみ
pnpm format
```

## デプロイ

### GitHub Actions + Raspberry Pi

このプロジェクトは GitHub Actions で ARM64 Docker イメージをビルドし、Raspberry Pi にデプロイする構成です。

#### 1. GitHub Container Registry の設定

main ブランチへの push で自動的にビルドが実行されます。

#### 2. Raspberry Pi のセットアップ

```bash
# ghcr.io への認証
echo $GITHUB_PAT | docker login ghcr.io -u USERNAME --password-stdin

# docker-compose.raspi.yml を配置
# .env ファイルに DATABASE_URL と ANTHROPIC_API_KEY を設定

# コンテナを起動
docker compose up -d
```

Watchtower が5分ごとに新しいイメージをチェックし、自動更新します。

#### 3. Cloudflare Tunnel での公開

Cloudflare Tunnel を使用して localhost:3000 を外部公開できます。

### 手動 Docker ビルド

```bash
# イメージをビルド
docker build -t ai-chat .

# コンテナを起動
docker run -p 3000:3000 \
  -e DATABASE_URL="mongodb+srv://..." \
  -e ANTHROPIC_API_KEY="sk-..." \
  ai-chat
```

## API エンドポイント

### チャット

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/chat` | メッセージ送信（SSEストリーミング） |

### 会話管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/conversations` | 会話一覧取得 |
| POST | `/api/conversations` | 新規会話作成 |
| GET | `/api/conversations/[id]` | 会話詳細取得 |
| PATCH | `/api/conversations/[id]` | タイトル更新 |
| DELETE | `/api/conversations/[id]` | 会話削除 |
| POST | `/api/conversations/generate-title` | タイトル自動生成 |

## プロジェクト構成

```
ai-chat/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── chat/         # チャットAPI (SSE)
│   │   │   └── conversations/ # 会話管理API
│   │   ├── layout.tsx        # ルートレイアウト
│   │   └── page.tsx          # メインページ
│   ├── components/
│   │   ├── chat/             # チャットUI
│   │   ├── layout/           # レイアウト
│   │   ├── sidebar/          # サイドバー
│   │   └── ui/               # shadcn/ui
│   ├── hooks/                # カスタムフック
│   └── lib/                  # ユーティリティ
├── prisma/
│   └── schema.prisma         # データベーススキーマ
├── .github/
│   └── workflows/            # GitHub Actions
└── Dockerfile                # Dockerビルド設定
```

## ライセンス

MIT

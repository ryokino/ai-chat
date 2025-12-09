.PHONY: help init install dev build test lint db-generate db-push docker-build docker-push docker-run deploy clean

# デフォルトターゲット
help:
	@echo "AI Chat Bot - 利用可能なコマンド:"
	@echo ""
	@echo "初期化:"
	@echo "  make init         - プロジェクト初期化 (install + db-setup)"
	@echo "  make install      - 依存関係をインストール"
	@echo ""
	@echo "開発:"
	@echo "  make dev          - 開発サーバーを起動"
	@echo "  make build        - 本番用にビルド"
	@echo "  make test         - テストを実行"
	@echo "  make test-watch   - テストをウォッチモードで実行"
	@echo "  make lint         - Linting実行"
	@echo "  make lint-fix     - Lintエラーを自動修正"
	@echo ""
	@echo "データベース:"
	@echo "  make db-generate  - Prisma Clientを生成"
	@echo "  make db-push      - データベースにスキーマをプッシュ"
	@echo "  make db-setup     - DB初期化 (generate + push)"
	@echo ""
	@echo "Docker/デプロイ:"
	@echo "  make docker-build - ARM64 Docker imageをビルド"
	@echo "  make docker-push  - Docker imageをghcr.ioにプッシュ"
	@echo "  make deploy       - ビルド + プッシュ (GitHub Actionsで自動)"
	@echo "  make docker-run   - Dockerコンテナを起動 (Raspberry Pi)"
	@echo ""
	@echo "その他:"
	@echo "  make clean        - ビルド成果物を削除"
	@echo ""

# プロジェクト初期化
init: install db-setup
	@echo "✅ プロジェクトの初期化が完了しました"

# 依存関係のインストール
install:
	pnpm install

# 開発サーバー起動
dev:
	pnpm dev

# ビルド
build:
	pnpm build

# テスト実行
test:
	pnpm test:run

# テストウォッチモード
test-watch:
	pnpm test

# Linting
lint:
	pnpm lint

# Lint自動修正
lint-fix:
	pnpm lint --fix

# Prisma Client生成
db-generate:
	pnpm prisma generate

# データベースプッシュ
db-push:
	pnpm prisma db push

# データベース初期化
db-setup: db-generate db-push

# Docker image ビルド (ARM64 for Raspberry Pi)
docker-build:
	docker buildx build --platform linux/arm64 -t ghcr.io/ryokino/ai-chat:latest .

# Docker image プッシュ
docker-push:
	docker push ghcr.io/ryokino/ai-chat:latest

# デプロイ (ビルド + プッシュ)
deploy: docker-build docker-push
	@echo "✅ Docker imageのビルドとプッシュが完了しました"
	@echo "Watchtowerが自動的に最新イメージをデプロイします (最大5分)"

# Dockerコンテナ起動 (Raspberry Pi用)
docker-run:
	docker compose -f docker-compose.raspi.yml up -d

# クリーンアップ
clean:
	rm -rf .next
	rm -rf node_modules/.cache
	rm -rf dist

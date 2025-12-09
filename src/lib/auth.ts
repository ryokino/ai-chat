/**
 * Better Auth サーバー設定
 * Google OAuth認証とMongoDBアダプターを使用
 * @module lib/auth
 */

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

/**
 * 環境に応じてbaseURLを自動設定
 * 優先順位: BETTER_AUTH_URL > NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost:3000
 */
const getBaseURL = (): string => {
	// 1. 明示的に設定された BETTER_AUTH_URL を優先
	if (process.env.BETTER_AUTH_URL) {
		return process.env.BETTER_AUTH_URL;
	}

	// 2. NEXT_PUBLIC_APP_URL を使用（開発・本番共通）
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}

	// 3. Vercel環境の場合
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// 4. デフォルト（開発環境）
	return "http://localhost:3000";
};

/**
 * MongoDB クライアント
 * グローバルシングルトンパターンで接続を管理
 */
declare global {
	var _mongoClient: MongoClient | undefined;
}

const mongoClient =
	global._mongoClient || new MongoClient(process.env.DATABASE_URL as string);

if (process.env.NODE_ENV !== "production") {
	global._mongoClient = mongoClient;
}

// MongoDB接続を同期的に確立
const db = mongoClient.db("ai-chat");

/**
 * Better Auth インスタンス
 * Google OAuth 2.0を使用した認証を提供
 */
export const auth = betterAuth({
	database: mongodbAdapter(db, {
		client: mongoClient,
	}),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	secret: process.env.BETTER_AUTH_SECRET as string,
	baseURL: getBaseURL(),
});

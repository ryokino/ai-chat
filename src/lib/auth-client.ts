/**
 * Better Auth クライアント設定
 * フロントエンドで使用するBetter Authクライアント
 * @module lib/auth-client
 */

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth クライアントインスタンス
 * Google OAuthでのサインイン/サインアウト、セッション管理を提供
 */
export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

/**
 * サインインフック
 * @example
 * const { signIn } = useAuthClient();
 * await signIn.social({ provider: "google" });
 */
export const { signIn, signOut, useSession } = authClient;

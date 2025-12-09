/**
 * Better Auth API ルートハンドラー
 * すべての認証リクエストを処理
 * @module app/api/auth/[...all]/route
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * GET/POSTリクエストをBetter Authハンドラーに転送
 */
export const { GET, POST } = toNextJsHandler(auth);

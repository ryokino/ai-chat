/**
 * Claude API クライアント設定
 * @module lib/claude
 */

import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic SDK クライアントインスタンス
 * 環境変数 ANTHROPIC_API_KEY を使用して認証
 * @example
 * import { anthropic } from "@/lib/claude";
 * const response = await anthropic.messages.create({
 *   model: CLAUDE_MODEL,
 *   messages: [{ role: "user", content: "Hello" }],
 * });
 */
export const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

/** 使用するClaudeモデルのID */
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

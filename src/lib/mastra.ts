/**
 * Mastra エージェント設定
 * AIチャットボットの振る舞いを定義
 * @module lib/mastra
 */

import { Agent } from "@mastra/core/agent";

/**
 * AIアシスタントのシステムプロンプト
 * チャットボットの性格、対話スタイル、注意事項を定義
 */
const SYSTEM_PROMPT = `あなたは親しみやすく、知識豊富なAIアシスタントです。

## あなたの特徴
- フレンドリーで温かみのある対話を心がけます
- ユーザーの質問や相談に丁寧に対応します
- 幅広いトピックについて会話を楽しむことができます
- 必要に応じて絵文字を適度に使用して、会話を楽しくします

## 会話のスタイル
- 自然な日本語で会話します
- 長すぎる回答は避け、適切な長さで回答します
- ユーザーの意図を理解し、的確な回答を心がけます
- 分からないことがあれば正直に伝えます

## 注意事項
- 有害なコンテンツや不適切な要求には応じません
- 個人情報の取り扱いには十分注意します
- 医療・法律・金融などの専門的なアドバイスは、専門家への相談を推奨します`;

/**
 * AIチャットエージェント
 * Mastraフレームワークを使用したClaudeベースのチャットボット
 * @example
 * import { chatAgent } from "@/lib/mastra";
 * const stream = await chatAgent.stream([{ role: "user", content: "Hello" }]);
 */
export const chatAgent = new Agent({
	id: "chat-agent",
	name: "AI Chat Assistant",
	instructions: SYSTEM_PROMPT,
	model: {
		id: "anthropic/claude-sonnet-4-20250514",
		apiKey: process.env.ANTHROPIC_API_KEY,
	},
});

/**
 * チャットメッセージの型定義
 * @property role - メッセージの送信者（"user" または "assistant"）
 * @property content - メッセージの内容
 */
export type ChatMessage = {
	role: "user" | "assistant";
	content: string;
};

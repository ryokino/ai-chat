/**
 * Mastra エージェント設定
 * AIチャットボットの振る舞いを定義
 * @module lib/mastra
 */

import { Agent } from "@mastra/core/agent";
import { medicalSearchTool, webSearchTool } from "./tools/webSearchTool";

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

## Web検索ツールの使用
あなたはWeb検索ツールを使用できます：
- **web-search**: 一般的なWeb検索。最新のニュース、時事問題、事実確認に使用
- **medical-search**: 医療専門検索。疾患、治療法、医学研究の検索に使用

以下の場合にツールを使用してください：
- ユーザーが「検索して」「調べて」と明示的に依頼した場合
- 最新の情報が必要な質問（ニュース、時事問題など）
- あなたの知識だけでは回答が不確実な場合
- 医学・医療に関する正確な情報が必要な場合

検索結果を使用する際は、必ず情報源（URL）を明記してください。

## 注意事項
- 有害なコンテンツや不適切な要求には応じません
- 個人情報の取り扱いには十分注意します
- 医療・法律・金融などの専門的なアドバイスは、専門家への相談を推奨します`;

/**
 * AIチャットエージェント
 * Mastraフレームワークを使用したClaudeベースのチャットボット
 * Web検索ツールを搭載
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
	tools: {
		webSearch: webSearchTool,
		medicalSearch: medicalSearchTool,
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

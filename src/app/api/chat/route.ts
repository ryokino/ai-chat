/**
 * チャット API ルート
 * SSE ストリーミングでAIレスポンスを返却
 * @module api/chat
 */

import type { NextRequest } from "next/server";
import { chatAgent } from "@/lib/mastra";
import { prisma } from "@/lib/prisma";
import {
	chatRateLimitConfig,
	checkRateLimit,
	getRateLimitHeaders,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** AI設定の型定義 */
interface AISettings {
	systemPrompt?: string;
	maxTokens?: number;
	temperature?: number;
}

/** チャットリクエストボディの型定義 */
interface ChatRequestBody {
	message: string;
	sessionId: string;
	conversationId?: string;
	settings?: AISettings;
}

/** メッセージを含む会話オブジェクトの型 */
type ConversationWithMessages = {
	id: string;
	sessionId: string;
	title: string | null;
	messages: { id: string; role: string; content: string; createdAt: Date }[];
	createdAt: Date;
	updatedAt: Date;
};

/**
 * チャットメッセージ送信エンドポイント
 * ユーザーメッセージを受け取り、AIレスポンスをSSEストリーミングで返却
 *
 * @param request - Next.js リクエストオブジェクト
 * @returns SSE ストリーミングレスポンス
 *
 * @example
 * // クライアントからのリクエスト
 * fetch("/api/chat", {
 *   method: "POST",
 *   body: JSON.stringify({
 *     message: "こんにちは",
 *     sessionId: "session-123",
 *     conversationId: "conv-456", // オプション
 *   }),
 * });
 */
export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as ChatRequestBody;
		const { message, sessionId, conversationId, settings } = body;

		if (!message || !sessionId) {
			return new Response(
				JSON.stringify({ error: "Message and sessionId are required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Rate Limitチェック（sessionIdで識別）
		const rateLimitResult = checkRateLimit(
			`chat:${sessionId}`,
			chatRateLimitConfig,
		);
		if (!rateLimitResult.success) {
			return new Response(JSON.stringify({ error: rateLimitResult.message }), {
				status: 429,
				headers: {
					"Content-Type": "application/json",
					...getRateLimitHeaders(rateLimitResult),
				},
			});
		}

		// Get or create conversation
		let conversation: ConversationWithMessages;

		if (conversationId) {
			// 既存の会話を取得（セッションIDで検証）
			const existingConversation = await prisma.conversation.findFirst({
				where: { id: conversationId, sessionId },
				include: { messages: true },
			});

			if (!existingConversation) {
				return new Response(
					JSON.stringify({ error: "Conversation not found" }),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			conversation = existingConversation;
		} else {
			// 新しい会話を作成
			conversation = await prisma.conversation.create({
				data: { sessionId },
				include: { messages: true },
			});
		}

		// Save user message to database
		await prisma.message.create({
			data: {
				conversationId: conversation.id,
				role: "user",
				content: message,
			},
		});

		// Get conversation history for context
		const conversationHistory = conversation.messages.map((msg) => ({
			role: msg.role as "user" | "assistant",
			content: msg.content,
		}));

		// Add current user message
		conversationHistory.push({ role: "user", content: message });

		// Build stream options with custom settings
		const streamOptions: {
			instructions?: string;
			maxTokens?: number;
			temperature?: number;
		} = {};

		if (settings?.systemPrompt) {
			streamOptions.instructions = settings.systemPrompt;
		}
		if (settings?.maxTokens) {
			streamOptions.maxTokens = settings.maxTokens;
		}
		if (settings?.temperature !== undefined) {
			streamOptions.temperature = settings.temperature;
		}

		// Stream response from Mastra agent
		// Note: Using type assertion as Mastra's stream method accepts message arrays
		const stream = await chatAgent.stream(
			conversationHistory as Parameters<typeof chatAgent.stream>[0],
			Object.keys(streamOptions).length > 0 ? streamOptions : undefined,
		);

		// Create a ReadableStream to send SSE
		const encoder = new TextEncoder();
		let fullResponse = "";

		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					// Stream the response chunks
					for await (const chunk of stream.textStream) {
						fullResponse += chunk;
						const data = JSON.stringify({ content: chunk });
						controller.enqueue(encoder.encode(`data: ${data}\n\n`));
					}

					// Save assistant message to database
					await prisma.message.create({
						data: {
							conversationId: conversation.id,
							role: "assistant",
							content: fullResponse,
						},
					});

					// Send conversation info (useful when new conversation is created)
					const infoData = JSON.stringify({
						conversationId: conversation.id,
						isNewConversation: !conversationId,
					});
					controller.enqueue(encoder.encode(`data: ${infoData}\n\n`));

					// Send done signal
					controller.enqueue(encoder.encode("data: [DONE]\n\n"));
					controller.close();
				} catch (error) {
					console.error("Streaming error:", error);
					const errorData = JSON.stringify({
						error: "Error during streaming",
					});
					controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
					controller.close();
				}
			},
		});

		return new Response(readableStream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache, no-transform",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no",
			},
		});
	} catch (error) {
		console.error("Chat API error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Internal server error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

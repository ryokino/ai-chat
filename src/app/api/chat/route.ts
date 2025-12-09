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
	userId?: string; // 追加: 認証済みユーザーのID
	conversationId?: string;
	settings?: AISettings;
}

/** メッセージを含む会話オブジェクトの型 */
type ConversationWithMessages = {
	id: string;
	sessionId: string | null;
	userId: string | null;
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
		const { message, sessionId, userId, conversationId, settings } = body;

		if (!message || (!sessionId && !userId)) {
			return new Response(
				JSON.stringify({
					error: "Message and sessionId or userId are required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Rate Limitチェック（userIdがあればuserId、なければsessionIdで識別）
		const rateLimitKey = userId ? `chat:user:${userId}` : `chat:${sessionId}`;
		const rateLimitResult = checkRateLimit(rateLimitKey, chatRateLimitConfig);
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
			// 既存の会話を取得（userIdまたはsessionIdで検証）
			const whereClause = userId
				? { id: conversationId, userId }
				: { id: conversationId, sessionId };

			const existingConversation = await prisma.conversation.findFirst({
				where: whereClause,
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
			// 新しい会話を作成（userIdまたはsessionIdを使用）
			const createData = userId
				? { userId }
				: { sessionId: sessionId || undefined };

			conversation = await prisma.conversation.create({
				data: createData,
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

		// Interface for search source information
		interface SearchSource {
			title: string;
			url: string;
			content?: string;
		}

		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					// Track search sources from tool calls
					const searchSources: SearchSource[] = [];

					// Use fullStream to capture both text and tool calls
					for await (const chunk of stream.fullStream) {
						if (chunk.type === "text-delta") {
							fullResponse += chunk.payload.text;
							const data = JSON.stringify({ content: chunk.payload.text });
							controller.enqueue(encoder.encode(`data: ${data}\n\n`));
						} else if (chunk.type === "tool-result") {
							// Capture search results from tool calls
							const result = chunk.payload.result as {
								results?: Array<{
									title: string;
									url: string;
									content?: string;
								}>;
							};
							if (result?.results && Array.isArray(result.results)) {
								for (const item of result.results) {
									searchSources.push({
										title: item.title || "Unknown",
										url: item.url,
										content: item.content?.slice(0, 200),
									});
								}
							}
						}
					}

					// Save assistant message to database
					await prisma.message.create({
						data: {
							conversationId: conversation.id,
							role: "assistant",
							content: fullResponse,
						},
					});

					// Send search sources if any
					if (searchSources.length > 0) {
						const sourcesData = JSON.stringify({
							searchSources: searchSources.slice(0, 5), // Limit to 5 sources
						});
						controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
					}

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

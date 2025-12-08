import type { NextRequest } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TITLE_GENERATION_PROMPT = `Based on the following user message, generate a short, descriptive title (max 30 characters) for this conversation.
The title should be in the same language as the message.
Return only the title, nothing else. Do not include quotes around the title.

User message: `;

/**
 * POST /api/conversations/generate-title
 * 最初のメッセージからAIでタイトルを自動生成
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { conversationId, sessionId } = body;

		if (!conversationId || !sessionId) {
			return new Response(
				JSON.stringify({ error: "conversationId and sessionId are required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 会話を取得（セッションIDで検証）
		const conversation = await prisma.conversation.findFirst({
			where: { id: conversationId, sessionId },
			include: {
				messages: {
					where: { role: "user" },
					orderBy: { createdAt: "asc" },
					take: 1,
				},
			},
		});

		if (!conversation) {
			return new Response(JSON.stringify({ error: "Conversation not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 既にタイトルがある場合はスキップ
		if (conversation.title) {
			return new Response(JSON.stringify({ title: conversation.title }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 最初のユーザーメッセージを取得
		const firstMessage = conversation.messages[0];
		if (!firstMessage) {
			return new Response(
				JSON.stringify({ error: "No messages found in conversation" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Claudeでタイトルを生成
		const response = await anthropic.messages.create({
			model: CLAUDE_MODEL,
			max_tokens: 50,
			messages: [
				{
					role: "user",
					content: TITLE_GENERATION_PROMPT + firstMessage.content,
				},
			],
		});

		// レスポンスからタイトルを抽出
		const titleContent = response.content[0];
		if (titleContent.type !== "text") {
			throw new Error("Unexpected response type");
		}

		const title = titleContent.text.trim().slice(0, 50); // 最大50文字

		// タイトルを保存
		await prisma.conversation.update({
			where: { id: conversationId },
			data: { title },
		});

		return new Response(JSON.stringify({ title }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Generate title error:", error);
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

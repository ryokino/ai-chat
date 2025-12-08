import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/conversations
 * セッションIDから会話履歴を取得
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get("sessionId");

		if (!sessionId) {
			return new Response(JSON.stringify({ error: "sessionId is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// セッションIDに紐づく会話を取得
		const conversation = await prisma.conversation.findFirst({
			where: { sessionId },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});

		if (!conversation) {
			return new Response(
				JSON.stringify({ conversation: null, messages: [] }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(
			JSON.stringify({
				conversation: {
					id: conversation.id,
					sessionId: conversation.sessionId,
					createdAt: conversation.createdAt,
					updatedAt: conversation.updatedAt,
				},
				messages: conversation.messages.map((msg) => ({
					id: msg.id,
					role: msg.role,
					content: msg.content,
					createdAt: msg.createdAt,
				})),
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Conversations GET error:", error);
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

/**
 * POST /api/conversations
 * 新しい会話セッションを作成
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { sessionId } = body;

		if (!sessionId) {
			return new Response(JSON.stringify({ error: "sessionId is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 新しい会話を作成
		const conversation = await prisma.conversation.create({
			data: { sessionId },
		});

		return new Response(
			JSON.stringify({
				conversation: {
					id: conversation.id,
					sessionId: conversation.sessionId,
					createdAt: conversation.createdAt,
					updatedAt: conversation.updatedAt,
				},
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Conversations POST error:", error);
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

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
	params: Promise<{ id: string }>;
}

/**
 * GET /api/conversations/[id]
 * 特定の会話とメッセージを取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get("sessionId");

		if (!sessionId) {
			return new Response(JSON.stringify({ error: "sessionId is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const conversation = await prisma.conversation.findFirst({
			where: {
				id,
				sessionId, // セッションIDでの検証（他人の会話を取得できないように）
			},
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});

		if (!conversation) {
			return new Response(JSON.stringify({ error: "Conversation not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(
			JSON.stringify({
				conversation: {
					id: conversation.id,
					sessionId: conversation.sessionId,
					title: conversation.title,
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
		console.error("Conversation GET error:", error);
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
 * PATCH /api/conversations/[id]
 * 会話のタイトルを更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { sessionId, title } = body;

		if (!sessionId) {
			return new Response(JSON.stringify({ error: "sessionId is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (typeof title !== "string") {
			return new Response(JSON.stringify({ error: "title is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// セッションIDでの検証
		const existingConversation = await prisma.conversation.findFirst({
			where: { id, sessionId },
		});

		if (!existingConversation) {
			return new Response(JSON.stringify({ error: "Conversation not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const conversation = await prisma.conversation.update({
			where: { id },
			data: { title },
		});

		return new Response(
			JSON.stringify({
				conversation: {
					id: conversation.id,
					sessionId: conversation.sessionId,
					title: conversation.title,
					createdAt: conversation.createdAt,
					updatedAt: conversation.updatedAt,
				},
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Conversation PATCH error:", error);
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
 * DELETE /api/conversations/[id]
 * 会話を削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { sessionId } = body;

		if (!sessionId) {
			return new Response(JSON.stringify({ error: "sessionId is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// セッションIDでの検証
		const existingConversation = await prisma.conversation.findFirst({
			where: { id, sessionId },
		});

		if (!existingConversation) {
			return new Response(JSON.stringify({ error: "Conversation not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 関連するメッセージを先に削除
		await prisma.message.deleteMany({
			where: { conversationId: id },
		});

		// 会話を削除
		await prisma.conversation.delete({
			where: { id },
		});

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Conversation DELETE error:", error);
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

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

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
		const userId = searchParams.get("userId");

		// サーバーサイドで認証検証
		const authenticatedUserId = await getAuthenticatedUserId(request);

		// userIdが指定されている場合、認証セッションと一致するか確認
		if (userId && userId !== authenticatedUserId) {
			return new Response(
				JSON.stringify({
					error: "Unauthorized: userId does not match authenticated session",
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (!sessionId && !userId) {
			return new Response(
				JSON.stringify({ error: "sessionId or userId is required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// userIdまたはsessionIdでの検証（他人の会話を取得できないように）
		const whereClause = userId ? { id, userId } : { id, sessionId };

		const conversation = await prisma.conversation.findFirst({
			where: whereClause,
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
					userId: conversation.userId,
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
		const { sessionId, userId, title } = body;

		// サーバーサイドで認証検証
		const authenticatedUserId = await getAuthenticatedUserId(request);

		// userIdが指定されている場合、認証セッションと一致するか確認
		if (userId && userId !== authenticatedUserId) {
			return new Response(
				JSON.stringify({
					error: "Unauthorized: userId does not match authenticated session",
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (!sessionId && !userId) {
			return new Response(
				JSON.stringify({ error: "sessionId or userId is required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (typeof title !== "string") {
			return new Response(JSON.stringify({ error: "title is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// userIdまたはsessionIdでの検証
		const whereClause = userId ? { id, userId } : { id, sessionId };
		const existingConversation = await prisma.conversation.findFirst({
			where: whereClause,
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
					userId: conversation.userId,
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
		const { sessionId, userId } = body;

		// サーバーサイドで認証検証
		const authenticatedUserId = await getAuthenticatedUserId(request);

		// userIdが指定されている場合、認証セッションと一致するか確認
		if (userId && userId !== authenticatedUserId) {
			return new Response(
				JSON.stringify({
					error: "Unauthorized: userId does not match authenticated session",
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (!sessionId && !userId) {
			return new Response(
				JSON.stringify({ error: "sessionId or userId is required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// userIdまたはsessionIdでの検証
		const whereClause = userId ? { id, userId } : { id, sessionId };
		const existingConversation = await prisma.conversation.findFirst({
			where: whereClause,
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

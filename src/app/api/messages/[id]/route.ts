/**
 * メッセージ API ルート
 * メッセージの削除機能を提供
 * @module api/messages/[id]
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const runtime = "nodejs";

interface DeleteRequestBody {
	sessionId?: string;
	userId?: string;
	deleteAfter?: boolean; // このメッセージ以降を全て削除するか
}

/**
 * メッセージを削除
 * deleteAfter=true の場合、指定メッセージ以降を全て削除（編集・再生成用）
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: messageId } = await params;
		const body = (await request.json()) as DeleteRequestBody;
		const { sessionId, userId, deleteAfter = false } = body;

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

		// sessionId または userId のいずれかが必須
		if (!sessionId && !userId) {
			return new Response(
				JSON.stringify({ error: "sessionId or userId is required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// メッセージを取得して所有権を確認
		const message = await prisma.message.findUnique({
			where: { id: messageId },
			include: {
				conversation: true,
			},
		});

		if (!message) {
			return new Response(JSON.stringify({ error: "Message not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 所有権の検証（sessionId または userId）
		const isOwner = userId
			? message.conversation.userId === userId
			: message.conversation.sessionId === sessionId;

		if (!isOwner) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (deleteAfter) {
			// このメッセージ以降を全て削除（編集・再生成用）
			const deletedMessages = await prisma.message.deleteMany({
				where: {
					conversationId: message.conversationId,
					createdAt: {
						gte: message.createdAt,
					},
				},
			});

			return new Response(
				JSON.stringify({
					success: true,
					deletedCount: deletedMessages.count,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 単一メッセージの削除
		await prisma.message.delete({
			where: { id: messageId },
		});

		return new Response(
			JSON.stringify({
				success: true,
				deletedCount: 1,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Message delete error:", error);
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

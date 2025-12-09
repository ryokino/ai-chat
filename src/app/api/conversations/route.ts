import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/conversations
 * セッションIDまたはuserIdから会話一覧を取得
 */
export async function GET(request: NextRequest) {
	try {
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

		// userIdまたはsessionIdに紐づく全ての会話を取得
		const whereClause = userId ? { userId } : { sessionId };

		const conversations = await prisma.conversation.findMany({
			where: whereClause,
			include: {
				_count: {
					select: { messages: true },
				},
			},
			orderBy: { updatedAt: "desc" },
		});

		return new Response(
			JSON.stringify({
				conversations: conversations.map((conv) => ({
					id: conv.id,
					sessionId: conv.sessionId,
					userId: conv.userId,
					title: conv.title,
					messageCount: conv._count.messages,
					createdAt: conv.createdAt,
					updatedAt: conv.updatedAt,
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

		// 新しい会話を作成（userIdまたはsessionIdを使用）
		const createData = userId ? { userId } : { sessionId };
		const conversation = await prisma.conversation.create({
			data: createData,
		});

		return new Response(
			JSON.stringify({
				conversation: {
					id: conversation.id,
					sessionId: conversation.sessionId,
					userId: conversation.userId,
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

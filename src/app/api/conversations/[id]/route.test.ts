import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "./route";

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
	prisma: {
		conversation: {
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		message: {
			deleteMany: vi.fn(),
		},
	},
}));

// 認証のモック
vi.mock("@/lib/auth", () => ({
	getAuthenticatedUserId: vi.fn(),
}));

describe("/api/conversations/[id] GET", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sessionIdで会話を取得できる", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
			title: "Test Conversation",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:05:00Z"),
			messages: [
				{
					id: "msg-1",
					role: "user",
					content: "Hello",
					createdAt: new Date("2024-01-01T10:00:00Z"),
				},
				{
					id: "msg-2",
					role: "assistant",
					content: "Hi there!",
					createdAt: new Date("2024-01-01T10:01:00Z"),
				},
			],
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/conv-1?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any, {
			params: Promise.resolve({ id: "conv-1" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.conversation.id).toBe("conv-1");
		expect(data.conversation.title).toBe("Test Conversation");
		expect(data.messages).toHaveLength(2);
		expect(data.messages[0].content).toBe("Hello");
		expect(data.messages[1].content).toBe("Hi there!");

		expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
			where: { id: "conv-1", sessionId: "test-session" },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});
	});

	it("userIdで会話を取得できる", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { getAuthenticatedUserId } = await import("@/lib/auth");

		// Mock authentication to return the same userId
		vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");

		const mockConversation = {
			id: "conv-2",
			sessionId: null,
			userId: "user-123",
			title: "User Conversation",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:05:00Z"),
			messages: [
				{
					id: "msg-3",
					role: "user",
					content: "Test",
					createdAt: new Date("2024-01-01T10:00:00Z"),
				},
			],
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/conv-2?userId=user-123",
			{ method: "GET" },
		);

		const response = await GET(request as any, {
			params: Promise.resolve({ id: "conv-2" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.conversation.userId).toBe("user-123");
		expect(data.messages).toHaveLength(1);

		expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
			where: { id: "conv-2", userId: "user-123" },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});
	});

	it("sessionIdもuserIdもない場合は400エラー", async () => {
		const request = new Request(
			"http://localhost:3000/api/conversations/conv-1",
			{ method: "GET" },
		);

		const response = await GET(request as any, {
			params: Promise.resolve({ id: "conv-1" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("sessionId or userId is required");
	});

	it("存在しない会話は404エラー", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

		const request = new Request(
			"http://localhost:3000/api/conversations/non-existent?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any, {
			params: Promise.resolve({ id: "non-existent" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe("Conversation not found");
	});

	it("他人の会話にアクセスすると404エラー", async () => {
		const { prisma } = await import("@/lib/prisma");

		// sessionIdが一致しないためfindFirstはnullを返す
		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

		const request = new Request(
			"http://localhost:3000/api/conversations/conv-other?sessionId=wrong-session",
			{ method: "GET" },
		);

		const response = await GET(request as any, {
			params: Promise.resolve({ id: "conv-other" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe("Conversation not found");
	});
});

describe("/api/conversations/[id] PATCH", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タイトルを更新できる", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockExistingConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
		};

		const mockUpdatedConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
			title: "Updated Title",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:10:00Z"),
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockExistingConversation as any,
		);
		vi.mocked(prisma.conversation.update).mockResolvedValue(
			mockUpdatedConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/conv-1",
			{
				method: "PATCH",
				body: JSON.stringify({
					sessionId: "test-session",
					title: "Updated Title",
				}),
			},
		);

		const response = await PATCH(request as any, {
			params: Promise.resolve({ id: "conv-1" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.conversation.title).toBe("Updated Title");

		expect(prisma.conversation.update).toHaveBeenCalledWith({
			where: { id: "conv-1" },
			data: { title: "Updated Title" },
		});
	});

	it("titleが文字列でない場合は400エラー", async () => {
		const request = new Request(
			"http://localhost:3000/api/conversations/conv-1",
			{
				method: "PATCH",
				body: JSON.stringify({
					sessionId: "test-session",
					title: 123, // 文字列でない
				}),
			},
		);

		const response = await PATCH(request as any, {
			params: Promise.resolve({ id: "conv-1" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("title is required");
	});

	it("sessionIdもuserIdもない場合は400エラー", async () => {
		const request = new Request(
			"http://localhost:3000/api/conversations/conv-1",
			{
				method: "PATCH",
				body: JSON.stringify({
					title: "New Title",
				}),
			},
		);

		const response = await PATCH(request as any, {
			params: Promise.resolve({ id: "conv-1" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("sessionId or userId is required");
	});
});

describe("/api/conversations/[id] DELETE", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("会話とメッセージを削除できる", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation as any,
		);
		vi.mocked(prisma.message.deleteMany).mockResolvedValue({ count: 3 } as any);
		vi.mocked(prisma.conversation.delete).mockResolvedValue(
			mockConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/conv-1",
			{
				method: "DELETE",
				body: JSON.stringify({
					sessionId: "test-session",
				}),
			},
		);

		const response = await DELETE(request as any, {
			params: Promise.resolve({ id: "conv-1" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);

		// メッセージが先に削除されることを確認
		expect(prisma.message.deleteMany).toHaveBeenCalledWith({
			where: { conversationId: "conv-1" },
		});

		// その後、会話が削除されることを確認
		expect(prisma.conversation.delete).toHaveBeenCalledWith({
			where: { id: "conv-1" },
		});

		// 呼び出し順序の確認
		const deleteManyCallOrder = vi.mocked(prisma.message.deleteMany).mock
			.invocationCallOrder[0];
		const deleteCallOrder = vi.mocked(prisma.conversation.delete).mock
			.invocationCallOrder[0];
		expect(deleteManyCallOrder).toBeLessThan(deleteCallOrder);
	});

	it("sessionIdもuserIdもない場合は400エラー", async () => {
		const request = new Request(
			"http://localhost:3000/api/conversations/conv-1",
			{
				method: "DELETE",
				body: JSON.stringify({}),
			},
		);

		const response = await DELETE(request as any, {
			params: Promise.resolve({ id: "conv-1" }),
		} as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("sessionId or userId is required");
	});
});

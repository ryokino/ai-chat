import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
	prisma: {
		conversation: {
			findFirst: vi.fn(),
			update: vi.fn(),
		},
	},
}));

// Claude APIのモック
vi.mock("@/lib/claude", () => ({
	anthropic: {
		messages: {
			create: vi.fn(),
		},
	},
	CLAUDE_MODEL: "claude-3-5-sonnet-20241022",
}));

describe("/api/conversations/generate-title POST", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Claude APIでタイトルを生成できる", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { anthropic } = await import("@/lib/claude");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
			title: null, // タイトルがまだない
			messages: [
				{
					id: "msg-1",
					role: "user",
					content: "TypeScriptについて教えて",
					createdAt: new Date("2024-01-01T10:00:00Z"),
				},
			],
		};

		const mockClaudeResponse = {
			content: [
				{
					type: "text",
					text: "TypeScript入門",
				},
			],
		};

		const mockUpdatedConversation = {
			id: "conv-1",
			title: "TypeScript入門",
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation as any,
		);
		vi.mocked(anthropic.messages.create).mockResolvedValue(
			mockClaudeResponse as any,
		);
		vi.mocked(prisma.conversation.update).mockResolvedValue(
			mockUpdatedConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/generate-title",
			{
				method: "POST",
				body: JSON.stringify({
					conversationId: "conv-1",
					sessionId: "test-session",
				}),
			},
		);

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.title).toBe("TypeScript入門");

		expect(anthropic.messages.create).toHaveBeenCalledWith({
			model: "claude-3-5-sonnet-20241022",
			max_tokens: 50,
			messages: [
				{
					role: "user",
					content: expect.stringContaining("TypeScriptについて教えて"),
				},
			],
		});

		expect(prisma.conversation.update).toHaveBeenCalledWith({
			where: { id: "conv-1" },
			data: { title: "TypeScript入門" },
		});
	});

	it("既存タイトルがある場合は生成せずそのまま返す", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { anthropic } = await import("@/lib/claude");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
			title: "既存のタイトル", // 既にタイトルがある
			messages: [],
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/generate-title",
			{
				method: "POST",
				body: JSON.stringify({
					conversationId: "conv-1",
					sessionId: "test-session",
				}),
			},
		);

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.title).toBe("既存のタイトル");

		// Claude APIが呼ばれていないことを確認
		expect(anthropic.messages.create).not.toHaveBeenCalled();

		// updateも呼ばれていないことを確認
		expect(prisma.conversation.update).not.toHaveBeenCalled();
	});

	it("conversationIdがない場合は400エラー", async () => {
		const request = new Request(
			"http://localhost:3000/api/conversations/generate-title",
			{
				method: "POST",
				body: JSON.stringify({
					sessionId: "test-session",
					// conversationId がない
				}),
			},
		);

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("conversationId is required");
	});

	it("sessionIdもuserIdもない場合は400エラー", async () => {
		const request = new Request(
			"http://localhost:3000/api/conversations/generate-title",
			{
				method: "POST",
				body: JSON.stringify({
					conversationId: "conv-1",
					// sessionId も userId もない
				}),
			},
		);

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("sessionId or userId is required");
	});

	it("会話が見つからない場合は404エラー", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

		const request = new Request(
			"http://localhost:3000/api/conversations/generate-title",
			{
				method: "POST",
				body: JSON.stringify({
					conversationId: "non-existent",
					sessionId: "test-session",
				}),
			},
		);

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe("Conversation not found");
	});

	it("メッセージがない場合は400エラー", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
			title: null,
			messages: [], // メッセージがない
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/generate-title",
			{
				method: "POST",
				body: JSON.stringify({
					conversationId: "conv-1",
					sessionId: "test-session",
				}),
			},
		);

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("No messages found in conversation");
	});

	it("長いタイトルは50文字に切り詰める", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { anthropic } = await import("@/lib/claude");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			userId: null,
			title: null,
			messages: [
				{
					id: "msg-1",
					role: "user",
					content: "長いメッセージ",
					createdAt: new Date("2024-01-01T10:00:00Z"),
				},
			],
		};

		// 50文字を超える長いタイトル
		const longTitle =
			"これは50文字を超える非常に長いタイトルですこれは50文字を超える非常に長いタイトルです";

		const mockClaudeResponse = {
			content: [
				{
					type: "text",
					text: longTitle,
				},
			],
		};

		const mockUpdatedConversation = {
			id: "conv-1",
			title: longTitle.slice(0, 50), // 50文字に切り詰め
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation as any,
		);
		vi.mocked(anthropic.messages.create).mockResolvedValue(
			mockClaudeResponse as any,
		);
		vi.mocked(prisma.conversation.update).mockResolvedValue(
			mockUpdatedConversation as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations/generate-title",
			{
				method: "POST",
				body: JSON.stringify({
					conversationId: "conv-1",
					sessionId: "test-session",
				}),
			},
		);

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.title).toHaveLength(50);
		expect(data.title).toBe(longTitle.slice(0, 50));

		expect(prisma.conversation.update).toHaveBeenCalledWith({
			where: { id: "conv-1" },
			data: { title: longTitle.slice(0, 50) },
		});
	});
});

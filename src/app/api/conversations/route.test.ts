import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
	prisma: {
		conversation: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
	},
}));

describe("/api/conversations GET", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 400 when sessionId is missing", async () => {
		const request = new Request("http://localhost:3000/api/conversations", {
			method: "GET",
		});

		const response = await GET(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("sessionId is required");
	});

	it("should return empty messages when conversation does not exist", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.conversation).toBeNull();
		expect(data.messages).toEqual([]);
	});

	it("should return conversation with messages when found", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:05:00Z"),
			messages: [
				{
					id: "msg-1",
					conversationId: "conv-1",
					role: "user",
					content: "Hello",
					createdAt: new Date("2024-01-01T10:01:00Z"),
				},
				{
					id: "msg-2",
					conversationId: "conv-1",
					role: "assistant",
					content: "Hi there!",
					createdAt: new Date("2024-01-01T10:02:00Z"),
				},
			],
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.conversation.id).toBe("conv-1");
		expect(data.conversation.sessionId).toBe("test-session");
		expect(data.messages).toHaveLength(2);
		expect(data.messages[0].role).toBe("user");
		expect(data.messages[0].content).toBe("Hello");
		expect(data.messages[1].role).toBe("assistant");
		expect(data.messages[1].content).toBe("Hi there!");
	});

	it("should query conversation with correct parameters", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=my-session-id",
			{ method: "GET" },
		);

		await GET(request as any);

		expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
			where: { sessionId: "my-session-id" },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});
	});

	it("should return messages ordered by createdAt ascending", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:05:00Z"),
			messages: [
				{
					id: "msg-1",
					conversationId: "conv-1",
					role: "user",
					content: "First",
					createdAt: new Date("2024-01-01T10:01:00Z"),
				},
				{
					id: "msg-2",
					conversationId: "conv-1",
					role: "assistant",
					content: "Second",
					createdAt: new Date("2024-01-01T10:02:00Z"),
				},
				{
					id: "msg-3",
					conversationId: "conv-1",
					role: "user",
					content: "Third",
					createdAt: new Date("2024-01-01T10:03:00Z"),
				},
			],
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any);
		const data = await response.json();

		expect(data.messages[0].content).toBe("First");
		expect(data.messages[1].content).toBe("Second");
		expect(data.messages[2].content).toBe("Third");
	});

	it("should return 500 on database error", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findFirst).mockRejectedValue(
			new Error("Database connection failed"),
		);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Database connection failed");
	});
});

describe("/api/conversations POST", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 400 when sessionId is missing", async () => {
		const request = new Request("http://localhost:3000/api/conversations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("sessionId is required");
	});

	it("should create a new conversation and return 201", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-1",
			sessionId: "new-session",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
		};

		vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation);

		const request = new Request("http://localhost:3000/api/conversations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sessionId: "new-session" }),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(201);
		expect(data.conversation.id).toBe("conv-1");
		expect(data.conversation.sessionId).toBe("new-session");
	});

	it("should call prisma.conversation.create with correct data", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session-id",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation);

		const request = new Request("http://localhost:3000/api/conversations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sessionId: "test-session-id" }),
		});

		await POST(request as any);

		expect(prisma.conversation.create).toHaveBeenCalledWith({
			data: { sessionId: "test-session-id" },
		});
	});

	it("should return 500 on database error", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.create).mockRejectedValue(
			new Error("Database write failed"),
		);

		const request = new Request("http://localhost:3000/api/conversations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sessionId: "test-session" }),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Database write failed");
	});

	it("should return conversation with all required fields", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversation = {
			id: "conv-123",
			sessionId: "session-456",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
		};

		vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation);

		const request = new Request("http://localhost:3000/api/conversations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sessionId: "session-456" }),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(data.conversation).toHaveProperty("id");
		expect(data.conversation).toHaveProperty("sessionId");
		expect(data.conversation).toHaveProperty("createdAt");
		expect(data.conversation).toHaveProperty("updatedAt");
	});
});

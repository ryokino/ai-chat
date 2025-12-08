import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
	prisma: {
		conversation: {
			findMany: vi.fn(),
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

	it("should return empty conversations when none exist", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.conversations).toEqual([]);
	});

	it("should return conversations list when found", async () => {
		const { prisma } = await import("@/lib/prisma");

		const mockConversations = [
			{
				id: "conv-1",
				sessionId: "test-session",
				title: "First conversation",
				createdAt: new Date("2024-01-01T10:00:00Z"),
				updatedAt: new Date("2024-01-01T10:05:00Z"),
				_count: { messages: 2 },
			},
			{
				id: "conv-2",
				sessionId: "test-session",
				title: null,
				createdAt: new Date("2024-01-02T10:00:00Z"),
				updatedAt: new Date("2024-01-02T10:05:00Z"),
				_count: { messages: 1 },
			},
		];

		vi.mocked(prisma.conversation.findMany).mockResolvedValue(
			mockConversations as any,
		);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=test-session",
			{ method: "GET" },
		);

		const response = await GET(request as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.conversations).toHaveLength(2);
		expect(data.conversations[0].id).toBe("conv-1");
		expect(data.conversations[0].title).toBe("First conversation");
		expect(data.conversations[0].messageCount).toBe(2);
		expect(data.conversations[1].id).toBe("conv-2");
		expect(data.conversations[1].title).toBeNull();
	});

	it("should query conversations with correct parameters", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

		const request = new Request(
			"http://localhost:3000/api/conversations?sessionId=my-session-id",
			{ method: "GET" },
		);

		await GET(request as any);

		expect(prisma.conversation.findMany).toHaveBeenCalledWith({
			where: { sessionId: "my-session-id" },
			include: { _count: { select: { messages: true } } },
			orderBy: { updatedAt: "desc" },
		});
	});

	it("should return 500 on database error", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findMany).mockRejectedValue(
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
			title: null,
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
			_count: { messages: 0 },
		};

		vi.mocked(prisma.conversation.create).mockResolvedValue(
			mockConversation as any,
		);

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
			title: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.create).mockResolvedValue(
			mockConversation as any,
		);

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
			title: null,
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
			_count: { messages: 0 },
		};

		vi.mocked(prisma.conversation.create).mockResolvedValue(
			mockConversation as any,
		);

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

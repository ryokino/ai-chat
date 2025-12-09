import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
	prisma: {
		conversation: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
		message: {
			create: vi.fn(),
		},
	},
}));

// Mastraのモック
vi.mock("@/lib/mastra", () => ({
	chatAgent: {
		stream: vi.fn(),
	},
}));

describe("/api/chat POST", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 400 when message is missing", async () => {
		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sessionId: "test-session" }),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("Message and sessionId or userId are required");
	});

	it("should return 400 when sessionId and userId are missing", async () => {
		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message: "Hello" }),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("Message and sessionId or userId are required");
	});

	it("should return 400 when both message and sessionId are missing", async () => {
		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("Message and sessionId or userId are required");
	});

	it("should create conversation if conversationId is not provided", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { chatAgent } = await import("@/lib/mastra");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			title: null,
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation);
		vi.mocked(prisma.message.create).mockResolvedValue({
			id: "msg-1",
			conversationId: "conv-1",
			role: "user",
			content: "Hello",
			createdAt: new Date(),
		});

		// Mock streaming response with fullStream
		const mockFullStream = (async function* () {
			yield { type: "text-delta", payload: { id: "1", text: "Hello" } };
			yield { type: "text-delta", payload: { id: "2", text: " there!" } };
		})();

		vi.mocked(chatAgent.stream).mockResolvedValue({
			fullStream: mockFullStream,
		} as any);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hello",
				sessionId: "test-session",
			}),
		});

		const response = await POST(request as any);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		expect(prisma.conversation.create).toHaveBeenCalledWith({
			data: { sessionId: "test-session" },
			include: { messages: true },
		});
	});

	it("should use existing conversation if conversationId is provided", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { chatAgent } = await import("@/lib/mastra");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			title: null,
			messages: [
				{
					id: "msg-0",
					conversationId: "conv-1",
					role: "user",
					content: "Previous message",
					createdAt: new Date(),
				},
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation,
		);
		vi.mocked(prisma.message.create).mockResolvedValue({
			id: "msg-1",
			conversationId: "conv-1",
			role: "user",
			content: "Hello",
			createdAt: new Date(),
		});

		const mockFullStream = (async function* () {
			yield { type: "text-delta", payload: { id: "1", text: "Response" } };
		})();

		vi.mocked(chatAgent.stream).mockResolvedValue({
			fullStream: mockFullStream,
		} as any);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hello",
				sessionId: "test-session",
				conversationId: "conv-1",
			}),
		});

		const response = await POST(request as any);

		expect(response.status).toBe(200);
		expect(prisma.conversation.create).not.toHaveBeenCalled();
		expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
			where: { id: "conv-1", sessionId: "test-session" },
			include: { messages: true },
		});
	});

	it("should save user message to database", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { chatAgent } = await import("@/lib/mastra");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			title: null,
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation,
		);
		vi.mocked(prisma.message.create).mockResolvedValue({
			id: "msg-1",
			conversationId: "conv-1",
			role: "user",
			content: "Test message",
			createdAt: new Date(),
		});

		const mockFullStream = (async function* () {
			yield { type: "text-delta", payload: { id: "1", text: "Response" } };
		})();

		vi.mocked(chatAgent.stream).mockResolvedValue({
			fullStream: mockFullStream,
		} as any);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Test message",
				sessionId: "test-session",
				conversationId: "conv-1",
			}),
		});

		await POST(request as any);

		expect(prisma.message.create).toHaveBeenCalledWith({
			data: {
				conversationId: "conv-1",
				role: "user",
				content: "Test message",
			},
		});
	});

	it("should stream SSE response correctly", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { chatAgent } = await import("@/lib/mastra");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			title: null,
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation,
		);
		vi.mocked(prisma.message.create).mockResolvedValue({
			id: "msg-1",
			conversationId: "conv-1",
			role: "user",
			content: "Hello",
			createdAt: new Date(),
		});

		const mockFullStream = (async function* () {
			yield { type: "text-delta", payload: { id: "1", text: "Hello" } };
			yield { type: "text-delta", payload: { id: "2", text: " " } };
			yield { type: "text-delta", payload: { id: "3", text: "World" } };
		})();

		vi.mocked(chatAgent.stream).mockResolvedValue({
			fullStream: mockFullStream,
		} as any);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hello",
				sessionId: "test-session",
				conversationId: "conv-1",
			}),
		});

		const response = await POST(request as any);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		expect(response.headers.get("Cache-Control")).toBe(
			"no-cache, no-transform",
		);

		// Read the stream
		const reader = response.body?.getReader();
		const decoder = new TextDecoder();
		let result = "";

		if (reader) {
			let done = false;
			while (!done) {
				const { value, done: readerDone } = await reader.read();
				done = readerDone;
				if (value) {
					result += decoder.decode(value, { stream: true });
				}
			}
		}

		expect(result).toContain('data: {"content":"Hello"}');
		expect(result).toContain('data: {"content":" "}');
		expect(result).toContain('data: {"content":"World"}');
		expect(result).toContain("data: [DONE]");
	});

	it("should save assistant message after streaming completes", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { chatAgent } = await import("@/lib/mastra");

		const mockConversation = {
			id: "conv-1",
			sessionId: "test-session",
			title: null,
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation,
		);

		let messageCreateCallCount = 0;
		vi.mocked(prisma.message.create).mockImplementation(async (args: any) => {
			messageCreateCallCount++;
			return {
				id: `msg-${messageCreateCallCount}`,
				conversationId: "conv-1",
				role: args.data.role,
				content: args.data.content,
				createdAt: new Date(),
			};
		});

		const mockFullStream = (async function* () {
			yield { type: "text-delta", payload: { id: "1", text: "Full" } };
			yield { type: "text-delta", payload: { id: "2", text: " " } };
			yield { type: "text-delta", payload: { id: "3", text: "Response" } };
		})();

		vi.mocked(chatAgent.stream).mockResolvedValue({
			fullStream: mockFullStream,
		} as any);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Test",
				sessionId: "test-session",
				conversationId: "conv-1",
			}),
		});

		const response = await POST(request as any);

		// Read the stream to completion
		const reader = response.body?.getReader();
		if (reader) {
			let done = false;
			while (!done) {
				const { done: readerDone } = await reader.read();
				done = readerDone;
			}
		}

		// Wait a bit for async operations
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Check that assistant message was saved with full response
		expect(prisma.message.create).toHaveBeenCalledWith({
			data: {
				conversationId: "conv-1",
				role: "assistant",
				content: "Full Response",
			},
		});
	});

	it("should return 404 when conversationId is provided but not found", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hello",
				sessionId: "test-session",
				conversationId: "non-existent",
			}),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe("Conversation not found");
	});

	it("should return 500 on internal error", async () => {
		const { prisma } = await import("@/lib/prisma");

		vi.mocked(prisma.conversation.create).mockRejectedValue(
			new Error("Database error"),
		);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hello",
				sessionId: "test-session",
			}),
		});

		const response = await POST(request as any);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Database error");
	});

	it("should accept userId instead of sessionId", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { chatAgent } = await import("@/lib/mastra");

		const mockConversation = {
			id: "conv-user-1",
			userId: "user-123",
			sessionId: null,
			title: null,
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
			mockConversation,
		);
		vi.mocked(prisma.message.create).mockResolvedValue({
			id: "msg-1",
			conversationId: "conv-user-1",
			role: "user",
			content: "Hello",
			createdAt: new Date(),
		});

		const mockFullStream = (async function* () {
			yield { type: "text-delta", payload: { id: "1", text: "Response" } };
		})();

		vi.mocked(chatAgent.stream).mockResolvedValue({
			fullStream: mockFullStream,
		} as any);

		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hello",
				userId: "user-123",
				conversationId: "conv-user-1",
			}),
		});

		const response = await POST(request as any);

		expect(response.status).toBe(200);
		expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
			where: { id: "conv-user-1", userId: "user-123" },
			include: { messages: true },
		});
	});
});

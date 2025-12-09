import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";

// Prisma のモック
vi.mock("@/lib/prisma", () => ({
	prisma: {
		message: {
			findUnique: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
	},
}));

import { prisma } from "@/lib/prisma";

describe("/api/messages/[id] DELETE", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createRequest = (body: Record<string, unknown>) => {
		return new NextRequest("http://localhost:3000/api/messages/msg-123", {
			method: "DELETE",
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json" },
		});
	};

	const mockParams = Promise.resolve({ id: "msg-123" });

	it("should return 400 if sessionId is missing", async () => {
		const request = createRequest({});
		const response = await DELETE(request, { params: mockParams });

		expect(response.status).toBe(400);
		const json = await response.json();
		expect(json.error).toBe("sessionId is required");
	});

	it("should return 404 if message not found", async () => {
		vi.mocked(prisma.message.findUnique).mockResolvedValue(null);

		const request = createRequest({ sessionId: "session-123" });
		const response = await DELETE(request, { params: mockParams });

		expect(response.status).toBe(404);
		const json = await response.json();
		expect(json.error).toBe("Message not found");
	});

	it("should return 403 if sessionId does not match", async () => {
		vi.mocked(prisma.message.findUnique).mockResolvedValue({
			id: "msg-123",
			conversationId: "conv-123",
			role: "user",
			content: "Hello",
			createdAt: new Date(),
			conversation: {
				id: "conv-123",
				sessionId: "different-session",
				title: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		} as Awaited<ReturnType<typeof prisma.message.findUnique>>);

		const request = createRequest({ sessionId: "session-123" });
		const response = await DELETE(request, { params: mockParams });

		expect(response.status).toBe(403);
		const json = await response.json();
		expect(json.error).toBe("Unauthorized");
	});

	it("should delete a single message", async () => {
		const mockMessage = {
			id: "msg-123",
			conversationId: "conv-123",
			role: "user",
			content: "Hello",
			createdAt: new Date(),
			conversation: {
				id: "conv-123",
				sessionId: "session-123",
				title: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		};

		vi.mocked(prisma.message.findUnique).mockResolvedValue(
			mockMessage as Awaited<ReturnType<typeof prisma.message.findUnique>>,
		);
		vi.mocked(prisma.message.delete).mockResolvedValue(
			mockMessage as Awaited<ReturnType<typeof prisma.message.delete>>,
		);

		const request = createRequest({ sessionId: "session-123" });
		const response = await DELETE(request, { params: mockParams });

		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.success).toBe(true);
		expect(json.deletedCount).toBe(1);
		expect(prisma.message.delete).toHaveBeenCalledWith({
			where: { id: "msg-123" },
		});
	});

	it("should delete message and all messages after it when deleteAfter is true", async () => {
		const messageDate = new Date("2024-01-01T10:00:00Z");
		const mockMessage = {
			id: "msg-123",
			conversationId: "conv-123",
			role: "user",
			content: "Hello",
			createdAt: messageDate,
			conversation: {
				id: "conv-123",
				sessionId: "session-123",
				title: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		};

		vi.mocked(prisma.message.findUnique).mockResolvedValue(
			mockMessage as Awaited<ReturnType<typeof prisma.message.findUnique>>,
		);
		vi.mocked(prisma.message.deleteMany).mockResolvedValue({ count: 3 });

		const request = createRequest({
			sessionId: "session-123",
			deleteAfter: true,
		});
		const response = await DELETE(request, { params: mockParams });

		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.success).toBe(true);
		expect(json.deletedCount).toBe(3);
		expect(prisma.message.deleteMany).toHaveBeenCalledWith({
			where: {
				conversationId: "conv-123",
				createdAt: {
					gte: messageDate,
				},
			},
		});
	});

	it("should return 500 on database error", async () => {
		vi.mocked(prisma.message.findUnique).mockRejectedValue(
			new Error("Database error"),
		);

		const request = createRequest({ sessionId: "session-123" });
		const response = await DELETE(request, { params: mockParams });

		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.error).toBe("Database error");
	});
});

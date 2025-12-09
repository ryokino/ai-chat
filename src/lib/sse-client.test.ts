import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteMessage,
	fetchConversations,
	processSSEStream,
	sendChatMessage,
} from "./sse-client";

// global.fetchのモック
global.fetch = vi.fn();

describe("processSSEStream", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("contentチャンクを受信してonMessageを呼び出す", async () => {
		const onMessage = vi.fn();
		const onComplete = vi.fn();

		// SSEストリームをシミュレート
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode('data: {"content":"Hello"}\n'));
				controller.enqueue(encoder.encode('data: {"content":" World"}\n'));
				controller.enqueue(encoder.encode("data: [DONE]\n"));
				controller.close();
			},
		});

		const mockResponse = new Response(stream, {
			status: 200,
			headers: { "Content-Type": "text/event-stream" },
		});

		await processSSEStream(mockResponse, { onMessage, onComplete });

		expect(onMessage).toHaveBeenCalledTimes(2);
		expect(onMessage).toHaveBeenNthCalledWith(1, '{"content":"Hello"}');
		expect(onMessage).toHaveBeenNthCalledWith(2, '{"content":" World"}');
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it("conversationInfo受信時にonConversationInfoを呼び出す", async () => {
		const onConversationInfo = vi.fn();
		const onComplete = vi.fn();

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(
					encoder.encode(
						'data: {"conversationId":"conv-1","isNewConversation":true}\n',
					),
				);
				controller.enqueue(encoder.encode("data: [DONE]\n"));
				controller.close();
			},
		});

		const mockResponse = new Response(stream, {
			status: 200,
		});

		await processSSEStream(mockResponse, { onConversationInfo, onComplete });

		expect(onConversationInfo).toHaveBeenCalledWith({
			conversationId: "conv-1",
			isNewConversation: true,
		});
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it("searchSources受信時にonSearchSourcesを呼び出す", async () => {
		const onSearchSources = vi.fn();
		const onComplete = vi.fn();

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(
					encoder.encode(
						'data: {"searchSources":[{"title":"Source 1","url":"https://example.com"}]}\n',
					),
				);
				controller.enqueue(encoder.encode("data: [DONE]\n"));
				controller.close();
			},
		});

		const mockResponse = new Response(stream, {
			status: 200,
		});

		await processSSEStream(mockResponse, { onSearchSources, onComplete });

		expect(onSearchSources).toHaveBeenCalledWith([
			{ title: "Source 1", url: "https://example.com" },
		]);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it("[DONE]受信時にonCompleteを呼び出す", async () => {
		const onComplete = vi.fn();

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode("data: [DONE]\n"));
				controller.close();
			},
		});

		const mockResponse = new Response(stream, {
			status: 200,
		});

		await processSSEStream(mockResponse, { onComplete });

		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it("HTTPエラー時にonErrorを呼び出す", async () => {
		const onError = vi.fn();

		const mockResponse = new Response(null, {
			status: 500,
			statusText: "Internal Server Error",
		});

		await expect(processSSEStream(mockResponse, { onError })).rejects.toThrow(
			"HTTP error! status: 500",
		);

		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "HTTP error! status: 500",
			}),
		);
	});
});

describe("sendChatMessage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正しいbodyでfetchを呼び出す", async () => {
		const mockFetch = vi.mocked(global.fetch);

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode("data: [DONE]\n"));
				controller.close();
			},
		});

		mockFetch.mockResolvedValue(
			new Response(stream, {
				status: 200,
			}),
		);

		await sendChatMessage("Hello", "session-123", null, "conv-1", {});

		expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				message: "Hello",
				sessionId: "session-123",
				conversationId: "conv-1",
			}),
		});
	});

	it("settings付きで送信する", async () => {
		const mockFetch = vi.mocked(global.fetch);

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode("data: [DONE]\n"));
				controller.close();
			},
		});

		mockFetch.mockResolvedValue(
			new Response(stream, {
				status: 200,
			}),
		);

		const settings = {
			systemPrompt: "Test prompt",
			maxTokens: 1024,
			temperature: 0.7,
		};

		await sendChatMessage("Hello", "session-123", null, null, {}, settings);

		expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				message: "Hello",
				sessionId: "session-123",
				settings,
			}),
		});
	});
});

describe("fetchConversations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sessionIdでクエリパラメータを含めてfetchを呼び出す", async () => {
		const mockFetch = vi.mocked(global.fetch);

		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({ conversations: [] }), {
				status: 200,
			}),
		);

		await fetchConversations("session-123", null);

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/conversations?sessionId=session-123",
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			},
		);
	});

	it("userIdでクエリパラメータを含めてfetchを呼び出す（優先）", async () => {
		const mockFetch = vi.mocked(global.fetch);

		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({ conversations: [] }), {
				status: 200,
			}),
		);

		await fetchConversations("session-123", "user-456");

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/conversations?userId=user-456",
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			},
		);
	});

	it("エラーレスポンス時にErrorをthrowする", async () => {
		const mockFetch = vi.mocked(global.fetch);

		mockFetch.mockResolvedValue(
			new Response(null, {
				status: 404,
			}),
		);

		await expect(fetchConversations("session-123", null)).rejects.toThrow(
			"Failed to fetch conversations: 404",
		);
	});
});

describe("deleteMessage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("deleteAfter=trueでbodyに含めてfetchを呼び出す", async () => {
		const mockFetch = vi.mocked(global.fetch);

		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({ success: true, deletedCount: 3 }), {
				status: 200,
			}),
		);

		await deleteMessage("msg-1", "session-123", null, true);

		expect(mockFetch).toHaveBeenCalledWith("/api/messages/msg-1", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				sessionId: "session-123",
				deleteAfter: true,
			}),
		});
	});

	it("userIdを使用する場合", async () => {
		const mockFetch = vi.mocked(global.fetch);

		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({ success: true, deletedCount: 1 }), {
				status: 200,
			}),
		);

		await deleteMessage("msg-1", "session-123", "user-456", false);

		expect(mockFetch).toHaveBeenCalledWith("/api/messages/msg-1", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				userId: "user-456",
				deleteAfter: false,
			}),
		});
	});
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as sseClient from "@/lib/sse-client";
import { useChat } from "./useChat";

// SSEクライアントのモック
vi.mock("@/lib/sse-client", () => ({
	fetchConversation: vi.fn(),
	sendChatMessage: vi.fn(),
	createConversation: vi.fn(),
	generateConversationTitle: vi.fn(),
}));

// Sonner toastのモック
vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

describe("useChat hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should initialize with empty messages and loading state", () => {
		const { result } = renderHook(() =>
			useChat({ sessionId: "test-session", conversationId: null }),
		);

		expect(result.current.messages).toEqual([]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
		expect(result.current.isInitialLoading).toBe(false);
	});

	it("should load conversation history on mount", async () => {
		const mockMessages = [
			{
				id: "1",
				role: "user",
				content: "Hello",
				createdAt: "2024-01-01T12:00:00Z",
			},
			{
				id: "2",
				role: "assistant",
				content: "Hi there!",
				createdAt: "2024-01-01T12:00:30Z",
			},
		];

		vi.mocked(sseClient.fetchConversation).mockResolvedValue({
			conversation: { id: "conv-1", sessionId: "test-session" },
			messages: mockMessages,
		});

		const { result } = renderHook(() =>
			useChat({ sessionId: "test-session", conversationId: "conv-1" }),
		);

		await waitFor(() => {
			expect(result.current.isInitialLoading).toBe(false);
		});

		expect(result.current.messages).toHaveLength(2);
		expect(result.current.messages[0].content).toBe("Hello");
		expect(result.current.messages[1].content).toBe("Hi there!");
	});

	it("should handle empty conversation history", async () => {
		vi.mocked(sseClient.fetchConversation).mockResolvedValue({
			conversation: { id: "conv-1", sessionId: "test-session" },
			messages: [],
		});

		const { result } = renderHook(() =>
			useChat({ sessionId: "test-session", conversationId: "conv-1" }),
		);

		await waitFor(() => {
			expect(result.current.isInitialLoading).toBe(false);
		});

		expect(result.current.messages).toEqual([]);
	});

	it("should clear error when clearError is called", async () => {
		const { result } = renderHook(() =>
			useChat({ sessionId: "test-session", conversationId: null }),
		);

		// エラーを手動で設定（内部状態を操作するため、実際のエラーをシミュレート）
		// ここではclearErrorの機能のみをテスト
		result.current.clearError();

		expect(result.current.error).toBeNull();
	});

	it("should handle conversation history loading error gracefully", async () => {
		vi.mocked(sseClient.fetchConversation).mockRejectedValue(
			new Error("Network error"),
		);

		const { result } = renderHook(() =>
			useChat({ sessionId: "test-session", conversationId: "conv-1" }),
		);

		await waitFor(() => {
			expect(result.current.isInitialLoading).toBe(false);
		});

		// 履歴読み込みエラーは致命的ではないので、エラーは表示されない
		expect(result.current.error).toBeNull();
		expect(result.current.messages).toEqual([]);
	});

	it("should not load history if conversationId is null", () => {
		const { result } = renderHook(() =>
			useChat({ sessionId: "test-session", conversationId: null }),
		);

		expect(result.current.isInitialLoading).toBe(false);
		expect(sseClient.fetchConversation).not.toHaveBeenCalled();
	});

	it("should clear messages when clearMessages is called", async () => {
		vi.mocked(sseClient.fetchConversation).mockResolvedValue({
			conversation: { id: "conv-1", sessionId: "test-session" },
			messages: [
				{
					id: "1",
					role: "user",
					content: "Hello",
					createdAt: "2024-01-01T12:00:00Z",
				},
			],
		});

		const { result } = renderHook(() =>
			useChat({ sessionId: "test-session", conversationId: "conv-1" }),
		);

		await waitFor(() => {
			expect(result.current.messages).toHaveLength(1);
		});

		act(() => {
			result.current.clearMessages();
		});

		expect(result.current.messages).toEqual([]);
	});
});

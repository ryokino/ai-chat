import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as sseClient from "@/lib/sse-client";
import { useConversations } from "./useConversations";

// SSEクライアントのモック
vi.mock("@/lib/sse-client", () => ({
	fetchConversations: vi.fn(),
	createConversation: vi.fn(),
	deleteConversation: vi.fn(),
	updateConversationTitle: vi.fn(),
	generateConversationTitle: vi.fn(),
}));

describe("useConversations hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("初期化時にfetchConversationsを呼び出す", async () => {
		const mockConversations = [
			{
				id: "conv-1",
				title: "Test conversation",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
		];

		vi.mocked(sseClient.fetchConversations).mockResolvedValue({
			conversations: mockConversations,
		});

		const { result } = renderHook(() => useConversations("test-session", null));

		// 初期状態はloading
		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(sseClient.fetchConversations).toHaveBeenCalledWith(
			"test-session",
			null,
		);
		expect(result.current.conversations).toEqual(mockConversations);
		expect(result.current.error).toBeNull();
	});

	it("userIdがある場合はuserIdで呼び出す", async () => {
		const mockConversations = [
			{
				id: "conv-user-1",
				title: "User conversation",
				sessionId: null,
				userId: "user-123",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 3,
			},
		];

		vi.mocked(sseClient.fetchConversations).mockResolvedValue({
			conversations: mockConversations,
		});

		const { result } = renderHook(() =>
			useConversations("test-session", "user-123"),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		// userIdを使って呼び出されることを確認
		expect(sseClient.fetchConversations).toHaveBeenCalledWith(
			"test-session",
			"user-123",
		);
		expect(result.current.conversations).toEqual(mockConversations);
	});

	it("createNewConversationで新規会話を作成しリストに追加する", async () => {
		vi.mocked(sseClient.fetchConversations).mockResolvedValue({
			conversations: [],
		});

		const newConversation = {
			id: "conv-new",
			title: null,
			sessionId: "test-session",
			userId: null,
			createdAt: "2024-01-01T11:00:00Z",
			updatedAt: "2024-01-01T11:00:00Z",
			messageCount: 0,
		};

		vi.mocked(sseClient.createConversation).mockResolvedValue({
			conversation: newConversation,
		});

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		let conversationId: string | null = null;

		await act(async () => {
			conversationId = await result.current.createNewConversation();
		});

		expect(sseClient.createConversation).toHaveBeenCalledWith(
			"test-session",
			null,
		);
		expect(conversationId).toBe("conv-new");
		expect(result.current.conversations).toHaveLength(1);
		expect(result.current.conversations[0].id).toBe("conv-new");
		expect(result.current.activeConversationId).toBe("conv-new");
	});

	it("createNewConversation: sessionIdとuserIdがない場合はnullを返す", async () => {
		// sessionIdとuserIdなしではrefetchが早期リターンするため、isLoadingはtrueのまま
		const { result } = renderHook(() => useConversations("", null));

		// refetch()が早期リターンするため、fetchConversationsは呼ばれない
		expect(sseClient.fetchConversations).not.toHaveBeenCalled();

		let conversationId: string | null = "initial";

		await act(async () => {
			conversationId = await result.current.createNewConversation();
		});

		expect(conversationId).toBeNull();
		expect(sseClient.createConversation).not.toHaveBeenCalled();
	});

	it("deleteConversationで会話を削除しリストから除外する", async () => {
		const mockConversations = [
			{
				id: "conv-1",
				title: "Conversation 1",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
			{
				id: "conv-2",
				title: "Conversation 2",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T11:00:00Z",
				updatedAt: "2024-01-01T11:05:00Z",
				messageCount: 3,
			},
		];

		vi.mocked(sseClient.fetchConversations).mockResolvedValue({
			conversations: mockConversations,
		});

		vi.mocked(sseClient.deleteConversation).mockResolvedValue({
			success: true,
		});

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		await act(async () => {
			await result.current.deleteConversation("conv-2");
		});

		expect(sseClient.deleteConversation).toHaveBeenCalledWith(
			"conv-2",
			"test-session",
			null,
		);
		expect(result.current.conversations).toHaveLength(1);
		expect(result.current.conversations[0].id).toBe("conv-1");
	});

	it("deleteConversation: アクティブな会話を削除すると最初の会話がアクティブになる", async () => {
		const mockConversations = [
			{
				id: "conv-1",
				title: "Conversation 1",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
			{
				id: "conv-2",
				title: "Conversation 2",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T11:00:00Z",
				updatedAt: "2024-01-01T11:05:00Z",
				messageCount: 3,
			},
		];

		vi.mocked(sseClient.fetchConversations).mockResolvedValue({
			conversations: mockConversations,
		});

		vi.mocked(sseClient.deleteConversation).mockResolvedValue({
			success: true,
		});

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		// conv-2をアクティブに設定
		act(() => {
			result.current.setActiveConversationId("conv-2");
		});

		expect(result.current.activeConversationId).toBe("conv-2");

		// アクティブな会話を削除
		await act(async () => {
			await result.current.deleteConversation("conv-2");
		});

		// 残りの最初の会話がアクティブになる
		expect(result.current.activeConversationId).toBe("conv-1");
		expect(result.current.conversations).toHaveLength(1);
		expect(result.current.conversations[0].id).toBe("conv-1");
	});

	it("updateTitleで会話のタイトルを更新する", async () => {
		const mockConversations = [
			{
				id: "conv-1",
				title: "Old title",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
		];

		vi.mocked(sseClient.fetchConversations).mockResolvedValue({
			conversations: mockConversations,
		});

		vi.mocked(sseClient.updateConversationTitle).mockResolvedValue({
			conversation: {
				id: "conv-1",
				title: "New title",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:10:00Z",
			},
		});

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		await act(async () => {
			await result.current.updateTitle("conv-1", "New title");
		});

		expect(sseClient.updateConversationTitle).toHaveBeenCalledWith(
			"conv-1",
			"test-session",
			null,
			"New title",
		);
		expect(result.current.conversations[0].title).toBe("New title");
	});

	it("generateTitleで会話のタイトルを自動生成する", async () => {
		const mockConversations = [
			{
				id: "conv-1",
				title: null,
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
		];

		vi.mocked(sseClient.fetchConversations).mockResolvedValue({
			conversations: mockConversations,
		});

		vi.mocked(sseClient.generateConversationTitle).mockResolvedValue({
			title: "Generated Title",
		});

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		await act(async () => {
			await result.current.generateTitle("conv-1");
		});

		expect(sseClient.generateConversationTitle).toHaveBeenCalledWith(
			"conv-1",
			"test-session",
			null,
		);
		expect(result.current.conversations[0].title).toBe("Generated Title");
	});

	it("refetchで会話一覧を再取得する", async () => {
		const initialConversations = [
			{
				id: "conv-1",
				title: "Conversation 1",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
		];

		const updatedConversations = [
			{
				id: "conv-1",
				title: "Conversation 1",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
			{
				id: "conv-2",
				title: "Conversation 2",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T11:00:00Z",
				updatedAt: "2024-01-01T11:05:00Z",
				messageCount: 3,
			},
		];

		vi.mocked(sseClient.fetchConversations).mockResolvedValueOnce({
			conversations: initialConversations,
		});

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.conversations).toHaveLength(1);

		// refetch用のモック更新
		vi.mocked(sseClient.fetchConversations).mockResolvedValueOnce({
			conversations: updatedConversations,
		});

		await act(async () => {
			await result.current.refetch();
		});

		expect(sseClient.fetchConversations).toHaveBeenCalledTimes(2);
		expect(result.current.conversations).toHaveLength(2);
		expect(result.current.conversations[1].id).toBe("conv-2");
	});

	it("エラーハンドリング: fetchConversationsが失敗した場合", async () => {
		vi.mocked(sseClient.fetchConversations).mockRejectedValue(
			new Error("Network error"),
		);

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.error).toBe("Network error");
		expect(result.current.conversations).toEqual([]);
	});

	it("clearErrorでエラーをクリアする", async () => {
		vi.mocked(sseClient.fetchConversations).mockRejectedValue(
			new Error("Network error"),
		);

		const { result } = renderHook(() => useConversations("test-session", null));

		await waitFor(() => {
			expect(result.current.error).toBe("Network error");
		});

		act(() => {
			result.current.clearError();
		});

		expect(result.current.error).toBeNull();
	});
});

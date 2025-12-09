/**
 * 会話管理カスタムフック
 * 会話一覧の取得、作成、削除、タイトル更新を管理
 * @module hooks/useConversations
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
	type ConversationSummary,
	createConversation,
	deleteConversation as deleteConversationAPI,
	fetchConversations,
	generateConversationTitle as generateTitleAPI,
	updateConversationTitle as updateTitleAPI,
} from "@/lib/sse-client";

/** useConversationsフックの戻り値の型 */
export interface UseConversationsReturn {
	conversations: ConversationSummary[];
	isLoading: boolean;
	error: string | null;
	activeConversationId: string | null;
	setActiveConversationId: (id: string | null) => void;
	createNewConversation: () => Promise<string | null>;
	deleteConversation: (id: string) => Promise<void>;
	updateTitle: (id: string, title: string) => Promise<void>;
	generateTitle: (id: string) => Promise<void>;
	refetch: () => Promise<void>;
	clearError: () => void;
}

/**
 * 会話管理フック
 * セッションIDに紐づく会話一覧を管理し、CRUD操作を提供
 * @param sessionId - ユーザーのセッションID
 * @returns 会話管理に必要な状態と関数
 * @example
 * const {
 *   conversations,
 *   createNewConversation,
 *   deleteConversation,
 * } = useConversations(sessionId);
 */
export function useConversations(sessionId: string): UseConversationsReturn {
	const [conversations, setConversations] = useState<ConversationSummary[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);

	const refetch = useCallback(async () => {
		if (!sessionId) return;

		try {
			setIsLoading(true);
			setError(null);
			const data = await fetchConversations(sessionId);
			setConversations(data.conversations);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch conversations",
			);
		} finally {
			setIsLoading(false);
		}
	}, [sessionId]);

	// 初回読み込み
	useEffect(() => {
		refetch();
	}, [refetch]);

	const createNewConversation = useCallback(async (): Promise<
		string | null
	> => {
		if (!sessionId) return null;

		try {
			setError(null);
			const data = await createConversation(sessionId);
			const newConversation = data.conversation;

			setConversations((prev) => [newConversation, ...prev]);
			setActiveConversationId(newConversation.id);

			return newConversation.id;
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create conversation",
			);
			return null;
		}
	}, [sessionId]);

	const deleteConversation = useCallback(
		async (id: string) => {
			if (!sessionId) return;

			try {
				setError(null);
				await deleteConversationAPI(id, sessionId);

				setConversations((prev) => prev.filter((c) => c.id !== id));

				// 削除した会話がアクティブだった場合、最初の会話をアクティブにする
				if (activeConversationId === id) {
					const remaining = conversations.filter((c) => c.id !== id);
					setActiveConversationId(
						remaining.length > 0 ? remaining[0].id : null,
					);
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to delete conversation",
				);
				throw err;
			}
		},
		[sessionId, activeConversationId, conversations],
	);

	const updateTitle = useCallback(
		async (id: string, title: string) => {
			if (!sessionId) return;

			try {
				setError(null);
				const data = await updateTitleAPI(id, sessionId, title);

				setConversations((prev) =>
					prev.map((c) =>
						c.id === id ? { ...c, title: data.conversation.title } : c,
					),
				);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to update title");
				throw err;
			}
		},
		[sessionId],
	);

	const generateTitle = useCallback(
		async (id: string) => {
			if (!sessionId) return;

			try {
				setError(null);
				const data = await generateTitleAPI(id, sessionId);

				setConversations((prev) =>
					prev.map((c) => (c.id === id ? { ...c, title: data.title } : c)),
				);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to generate title",
				);
				// タイトル生成の失敗は静かに無視（UXを損なわないため）
				console.error("Failed to generate title:", err);
			}
		},
		[sessionId],
	);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		conversations,
		isLoading,
		error,
		activeConversationId,
		setActiveConversationId,
		createNewConversation,
		deleteConversation,
		updateTitle,
		generateTitle,
		refetch,
		clearError,
	};
}

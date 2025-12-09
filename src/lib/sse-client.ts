/**
 * SSE (Server-Sent Events) クライアント
 * ストリーミングレスポンスを処理するためのユーティリティ
 */

import type { ImageAttachment } from "@/types/attachment";

/**
 * 検索ソース情報
 */
export interface SearchSource {
	title: string;
	url: string;
	content?: string;
}

export interface SSEOptions {
	onMessage?: (data: string) => void;
	onError?: (error: Error) => void;
	onComplete?: () => void;
	onConversationInfo?: (info: {
		conversationId: string;
		isNewConversation: boolean;
	}) => void;
	onSearchSources?: (sources: SearchSource[]) => void;
}

export interface ConversationSummary {
	id: string;
	sessionId: string | null;
	userId: string | null;
	title: string | null;
	messageCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	attachments?: ImageAttachment[];
	createdAt: string;
}

/**
 * SSEストリーミングレスポンスを処理
 * @param response - fetchのレスポンスオブジェクト
 * @param options - コールバック関数
 */
export async function processSSEStream(
	response: Response,
	options: SSEOptions = {},
): Promise<void> {
	const {
		onMessage,
		onError,
		onComplete,
		onConversationInfo,
		onSearchSources,
	} = options;

	if (!response.ok) {
		const error = new Error(`HTTP error! status: ${response.status}`);
		onError?.(error);
		throw error;
	}

	const reader = response.body?.getReader();
	if (!reader) {
		const error = new Error("Response body is not readable");
		onError?.(error);
		throw error;
	}

	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			// デコードして既存のバッファに追加
			buffer += decoder.decode(value, { stream: true });

			// 改行で分割して各行を処理
			const lines = buffer.split("\n");

			// 最後の不完全な行はバッファに残す
			buffer = lines.pop() || "";

			for (const line of lines) {
				// SSE形式のデータを処理
				if (line.startsWith("data: ")) {
					const data = line.slice(6).trim();

					// [DONE]シグナルをチェック
					if (data === "[DONE]") {
						continue;
					}

					// データが空でない場合のみコールバックを呼ぶ
					if (data) {
						try {
							const parsed = JSON.parse(data);

							// conversationInfo を処理
							if (
								parsed.conversationId &&
								typeof parsed.isNewConversation === "boolean"
							) {
								onConversationInfo?.(parsed);
							} else if (
								parsed.searchSources &&
								Array.isArray(parsed.searchSources)
							) {
								// 検索ソース情報を処理
								onSearchSources?.(parsed.searchSources);
							} else if (parsed.content !== undefined) {
								// 通常のメッセージコンテンツ
								onMessage?.(data);
							} else if (parsed.error) {
								// エラーメッセージ
								onError?.(new Error(parsed.error));
							}
						} catch {
							// JSONパースに失敗した場合は生データとして処理
							onMessage?.(data);
						}
					}
				}
			}
		}

		onComplete?.();
	} catch (error) {
		const err =
			error instanceof Error ? error : new Error("Unknown streaming error");
		onError?.(err);
		throw err;
	} finally {
		reader.releaseLock();
	}
}

/** AI設定の型定義 */
export interface AISettings {
	systemPrompt?: string;
	maxTokens?: number;
	temperature?: number;
}

/**
 * チャットメッセージをストリーミング送信
 * @param message - 送信するメッセージ
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 * @param conversationId - 会話ID（オプション、指定しない場合は新規作成）
 * @param options - SSEオプション
 * @param settings - AI設定（オプション）
 * @param attachments - 画像添付（オプション）
 */
export async function sendChatMessage(
	message: string,
	sessionId: string,
	userId: string | null,
	conversationId: string | null,
	options: SSEOptions = {},
	settings?: AISettings,
	attachments?: ImageAttachment[],
): Promise<void> {
	const response = await fetch("/api/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			message,
			sessionId,
			...(userId && { userId }),
			...(conversationId && { conversationId }),
			...(settings && { settings }),
			...(attachments && { attachments }),
		}),
	});

	await processSSEStream(response, options);
}

/**
 * 会話一覧を取得
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 */
export async function fetchConversations(
	sessionId: string,
	userId: string | null,
): Promise<{ conversations: ConversationSummary[] }> {
	const params = new URLSearchParams();
	if (userId) {
		params.append("userId", userId);
	} else {
		params.append("sessionId", sessionId);
	}

	const response = await fetch(`/api/conversations?${params.toString()}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch conversations: ${response.status}`);
	}

	return response.json();
}

/**
 * 特定の会話とメッセージを取得
 * @param conversationId - 会話ID
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 */
export async function fetchConversation(
	conversationId: string,
	sessionId: string,
	userId: string | null,
): Promise<{
	conversation: ConversationSummary;
	messages: Message[];
}> {
	const params = new URLSearchParams();
	if (userId) {
		params.append("userId", userId);
	} else {
		params.append("sessionId", sessionId);
	}

	const response = await fetch(
		`/api/conversations/${conversationId}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch conversation: ${response.status}`);
	}

	return response.json();
}

/**
 * 新しい会話セッションを作成
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 */
export async function createConversation(
	sessionId: string,
	userId: string | null,
): Promise<{ conversation: ConversationSummary }> {
	const response = await fetch("/api/conversations", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			...(userId ? { userId } : { sessionId }),
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to create conversation: ${response.status}`);
	}

	return response.json();
}

/**
 * 会話を削除
 * @param conversationId - 会話ID
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 */
export async function deleteConversation(
	conversationId: string,
	sessionId: string,
	userId: string | null,
): Promise<void> {
	const response = await fetch(`/api/conversations/${conversationId}`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			...(userId ? { userId } : { sessionId }),
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to delete conversation: ${response.status}`);
	}
}

/**
 * 会話タイトルを更新
 * @param conversationId - 会話ID
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 * @param title - 新しいタイトル
 */
export async function updateConversationTitle(
	conversationId: string,
	sessionId: string,
	userId: string | null,
	title: string,
): Promise<{ conversation: ConversationSummary }> {
	const response = await fetch(`/api/conversations/${conversationId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			...(userId ? { userId } : { sessionId }),
			title,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to update conversation title: ${response.status}`);
	}

	return response.json();
}

/**
 * タイトルを自動生成
 * @param conversationId - 会話ID
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 */
export async function generateConversationTitle(
	conversationId: string,
	sessionId: string,
	userId: string | null,
): Promise<{ title: string }> {
	const response = await fetch("/api/conversations/generate-title", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			conversationId,
			...(userId ? { userId } : { sessionId }),
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to generate title: ${response.status}`);
	}

	return response.json();
}

/**
 * メッセージを削除
 * @param messageId - 削除するメッセージのID
 * @param sessionId - セッションID
 * @param userId - ユーザーID（認証済みの場合）
 * @param deleteAfter - このメッセージ以降を全て削除するか（デフォルト: false）
 */
export async function deleteMessage(
	messageId: string,
	sessionId: string,
	userId: string | null,
	deleteAfter = false,
): Promise<{ success: boolean; deletedCount: number }> {
	const response = await fetch(`/api/messages/${messageId}`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			...(userId ? { userId } : { sessionId }),
			deleteAfter,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to delete message: ${response.status}`);
	}

	return response.json();
}

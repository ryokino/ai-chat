/**
 * SSE (Server-Sent Events) クライアント
 * ストリーミングレスポンスを処理するためのユーティリティ
 */

export interface SSEOptions {
	onMessage?: (data: string) => void;
	onError?: (error: Error) => void;
	onComplete?: () => void;
	onConversationInfo?: (info: {
		conversationId: string;
		isNewConversation: boolean;
	}) => void;
}

export interface ConversationSummary {
	id: string;
	sessionId: string;
	title: string | null;
	messageCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
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
	const { onMessage, onError, onComplete, onConversationInfo } = options;

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
 * @param conversationId - 会話ID（オプション、指定しない場合は新規作成）
 * @param options - SSEオプション
 * @param settings - AI設定（オプション）
 */
export async function sendChatMessage(
	message: string,
	sessionId: string,
	conversationId: string | null,
	options: SSEOptions = {},
	settings?: AISettings,
): Promise<void> {
	const response = await fetch("/api/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			message,
			sessionId,
			...(conversationId && { conversationId }),
			...(settings && { settings }),
		}),
	});

	await processSSEStream(response, options);
}

/**
 * 会話一覧を取得
 * @param sessionId - セッションID
 */
export async function fetchConversations(
	sessionId: string,
): Promise<{ conversations: ConversationSummary[] }> {
	const response = await fetch(
		`/api/conversations?sessionId=${encodeURIComponent(sessionId)}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch conversations: ${response.status}`);
	}

	return response.json();
}

/**
 * 特定の会話とメッセージを取得
 * @param conversationId - 会話ID
 * @param sessionId - セッションID
 */
export async function fetchConversation(
	conversationId: string,
	sessionId: string,
): Promise<{
	conversation: ConversationSummary;
	messages: Message[];
}> {
	const response = await fetch(
		`/api/conversations/${conversationId}?sessionId=${encodeURIComponent(sessionId)}`,
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
 */
export async function createConversation(
	sessionId: string,
): Promise<{ conversation: ConversationSummary }> {
	const response = await fetch("/api/conversations", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sessionId }),
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
 */
export async function deleteConversation(
	conversationId: string,
	sessionId: string,
): Promise<void> {
	const response = await fetch(`/api/conversations/${conversationId}`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sessionId }),
	});

	if (!response.ok) {
		throw new Error(`Failed to delete conversation: ${response.status}`);
	}
}

/**
 * 会話タイトルを更新
 * @param conversationId - 会話ID
 * @param sessionId - セッションID
 * @param title - 新しいタイトル
 */
export async function updateConversationTitle(
	conversationId: string,
	sessionId: string,
	title: string,
): Promise<{ conversation: ConversationSummary }> {
	const response = await fetch(`/api/conversations/${conversationId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sessionId, title }),
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
 */
export async function generateConversationTitle(
	conversationId: string,
	sessionId: string,
): Promise<{ title: string }> {
	const response = await fetch("/api/conversations/generate-title", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ conversationId, sessionId }),
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
 * @param deleteAfter - このメッセージ以降を全て削除するか（デフォルト: false）
 */
export async function deleteMessage(
	messageId: string,
	sessionId: string,
	deleteAfter = false,
): Promise<{ success: boolean; deletedCount: number }> {
	const response = await fetch(`/api/messages/${messageId}`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sessionId, deleteAfter }),
	});

	if (!response.ok) {
		throw new Error(`Failed to delete message: ${response.status}`);
	}

	return response.json();
}

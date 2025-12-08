/**
 * SSE (Server-Sent Events) クライアント
 * ストリーミングレスポンスを処理するためのユーティリティ
 */

export interface SSEOptions {
	onMessage?: (data: string) => void;
	onError?: (error: Error) => void;
	onComplete?: () => void;
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
	const { onMessage, onError, onComplete } = options;

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
					if (data && onMessage) {
						try {
							onMessage(data);
						} catch (error) {
							console.error("Error in onMessage callback:", error);
							onError?.(
								error instanceof Error
									? error
									: new Error("Unknown error in callback"),
							);
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

/**
 * チャットメッセージをストリーミング送信
 * @param message - 送信するメッセージ
 * @param sessionId - セッションID
 * @param options - SSEオプション
 */
export async function sendChatMessage(
	message: string,
	sessionId: string,
	options: SSEOptions = {},
): Promise<void> {
	const response = await fetch("/api/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			message,
			sessionId,
		}),
	});

	await processSSEStream(response, options);
}

/**
 * 会話履歴を取得
 * @param sessionId - セッションID
 */
export async function fetchConversationHistory(sessionId: string) {
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
		throw new Error(`Failed to fetch conversation history: ${response.status}`);
	}

	const data = await response.json();
	return data;
}

/**
 * 新しい会話セッションを作成
 * @param sessionId - セッションID
 */
export async function createConversation(sessionId: string) {
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

	const data = await response.json();
	return data;
}

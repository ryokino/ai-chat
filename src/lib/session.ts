import { nanoid } from "nanoid";

const SESSION_KEY = "ai-chat-session-id";

/**
 * 新しいセッションIDを生成
 */
export function generateSessionId(): string {
	return nanoid();
}

/**
 * localStorageからセッションIDを取得
 * 存在しない場合は新規生成して保存
 */
export function getSessionId(): string {
	if (typeof window === "undefined") {
		return "";
	}

	let sessionId = localStorage.getItem(SESSION_KEY);

	if (!sessionId) {
		sessionId = generateSessionId();
		saveSessionId(sessionId);
	}

	return sessionId;
}

/**
 * セッションIDをlocalStorageに保存
 */
export function saveSessionId(sessionId: string): void {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.setItem(SESSION_KEY, sessionId);
}

/**
 * セッションIDをクリア
 */
export function clearSessionId(): void {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.removeItem(SESSION_KEY);
}

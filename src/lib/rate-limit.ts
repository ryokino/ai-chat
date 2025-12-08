/**
 * シンプルなメモリベースのRate Limiter
 * 本番環境ではRedisベースの実装を推奨
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

// メモリ内でリクエストカウントを管理
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期的に古いエントリをクリーンアップ（メモリリーク防止）
const CLEANUP_INTERVAL = 60 * 1000; // 1分ごと

let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
	if (cleanupInterval) return;

	cleanupInterval = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of rateLimitStore.entries()) {
			if (entry.resetTime < now) {
				rateLimitStore.delete(key);
			}
		}
	}, CLEANUP_INTERVAL);
}

// プロセス起動時にクリーンアップを開始
startCleanup();

export interface RateLimitConfig {
	/** ウィンドウ時間（ミリ秒） */
	windowMs: number;
	/** ウィンドウ内の最大リクエスト数 */
	maxRequests: number;
}

export interface RateLimitResult {
	/** リクエストが許可されたか */
	success: boolean;
	/** 残りのリクエスト数 */
	remaining: number;
	/** リセットまでの時間（ミリ秒） */
	resetIn: number;
	/** Rate Limitに達した場合のエラーメッセージ */
	message?: string;
}

/**
 * Rate Limitをチェック
 * @param identifier クライアント識別子（IPアドレスやセッションIDなど）
 * @param config Rate Limit設定
 * @returns Rate Limitチェック結果
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig,
): RateLimitResult {
	const now = Date.now();
	const entry = rateLimitStore.get(identifier);

	// 新しいエントリまたは期限切れの場合
	if (!entry || entry.resetTime < now) {
		rateLimitStore.set(identifier, {
			count: 1,
			resetTime: now + config.windowMs,
		});
		return {
			success: true,
			remaining: config.maxRequests - 1,
			resetIn: config.windowMs,
		};
	}

	// 既存のエントリをチェック
	if (entry.count >= config.maxRequests) {
		return {
			success: false,
			remaining: 0,
			resetIn: entry.resetTime - now,
			message: `Rate limit exceeded. Please try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
		};
	}

	// カウントを増やす
	entry.count++;
	return {
		success: true,
		remaining: config.maxRequests - entry.count,
		resetIn: entry.resetTime - now,
	};
}

/**
 * Rate Limitヘッダーを生成
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
	return {
		"X-RateLimit-Remaining": result.remaining.toString(),
		"X-RateLimit-Reset": Math.ceil(result.resetIn / 1000).toString(),
	};
}

// デフォルトのRate Limit設定
export const defaultRateLimitConfig: RateLimitConfig = {
	windowMs: 60 * 1000, // 1分
	maxRequests: 20, // 1分あたり20リクエスト
};

// チャットAPI用のRate Limit設定（より厳格）
export const chatRateLimitConfig: RateLimitConfig = {
	windowMs: 60 * 1000, // 1分
	maxRequests: 10, // 1分あたり10リクエスト
};

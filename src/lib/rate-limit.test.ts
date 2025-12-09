import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkRateLimit,
	getRateLimitHeaders,
	type RateLimitConfig,
} from "./rate-limit";

describe("checkRateLimit", () => {
	const testConfig: RateLimitConfig = {
		windowMs: 60000, // 1分
		maxRequests: 10,
	};

	beforeEach(() => {
		// 固定時刻を設定
		vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("初回リクエストで成功を返す", () => {
		const result = checkRateLimit("test-identifier-1", testConfig);

		expect(result.success).toBe(true);
		expect(result.remaining).toBe(9); // maxRequests(10) - 1
		expect(result.resetIn).toBe(60000);
	});

	it("制限内のリクエストで成功を返し、残り数が減る", () => {
		const identifier = "test-identifier-2";

		// 1回目
		const result1 = checkRateLimit(identifier, testConfig);
		expect(result1.success).toBe(true);
		expect(result1.remaining).toBe(9);

		// 2回目
		const result2 = checkRateLimit(identifier, testConfig);
		expect(result2.success).toBe(true);
		expect(result2.remaining).toBe(8);

		// 3回目
		const result3 = checkRateLimit(identifier, testConfig);
		expect(result3.success).toBe(true);
		expect(result3.remaining).toBe(7);
	});

	it("制限超過で失敗を返す", () => {
		const identifier = "test-identifier-3";

		// maxRequests(10)回リクエスト
		for (let i = 0; i < 10; i++) {
			const result = checkRateLimit(identifier, testConfig);
			expect(result.success).toBe(true);
		}

		// 11回目は失敗
		const result = checkRateLimit(identifier, testConfig);
		expect(result.success).toBe(false);
		expect(result.remaining).toBe(0);
		expect(result.message).toContain("Rate limit exceeded");
		expect(result.message).toContain("60 seconds");
	});

	it("異なるidentifierで独立してカウントする", () => {
		const identifier1 = "test-identifier-4";
		const identifier2 = "test-identifier-5";

		// identifier1で5回
		for (let i = 0; i < 5; i++) {
			checkRateLimit(identifier1, testConfig);
		}

		// identifier2で5回
		for (let i = 0; i < 5; i++) {
			checkRateLimit(identifier2, testConfig);
		}

		// 両方ともまだ成功する（独立してカウント）
		const result1 = checkRateLimit(identifier1, testConfig);
		expect(result1.success).toBe(true);
		expect(result1.remaining).toBe(4); // 6回目なので10-6=4

		const result2 = checkRateLimit(identifier2, testConfig);
		expect(result2.success).toBe(true);
		expect(result2.remaining).toBe(4); // 6回目なので10-6=4
	});

	it("ウィンドウ経過後にリセットされる", () => {
		const identifier = "test-identifier-6";

		// maxRequests回リクエスト
		for (let i = 0; i < 10; i++) {
			checkRateLimit(identifier, testConfig);
		}

		// 11回目は失敗
		let result = checkRateLimit(identifier, testConfig);
		expect(result.success).toBe(false);
		expect(result.remaining).toBe(0);

		// 61秒後（ウィンドウ経過）
		vi.setSystemTime(new Date("2024-01-01T00:01:01Z"));

		// リセットされて成功
		result = checkRateLimit(identifier, testConfig);
		expect(result.success).toBe(true);
		expect(result.remaining).toBe(9);
	});
});

describe("getRateLimitHeaders", () => {
	it("正しいヘッダーを返す", () => {
		const result = {
			success: true,
			remaining: 5,
			resetIn: 30000, // 30秒
		};

		const headers = getRateLimitHeaders(result);

		expect(headers["X-RateLimit-Remaining"]).toBe("5");
		expect(headers["X-RateLimit-Reset"]).toBe("30"); // 秒単位
	});

	it("0秒のresetInを正しく処理する", () => {
		const result = {
			success: false,
			remaining: 0,
			resetIn: 500, // 0.5秒
		};

		const headers = getRateLimitHeaders(result);

		expect(headers["X-RateLimit-Remaining"]).toBe("0");
		expect(headers["X-RateLimit-Reset"]).toBe("1"); // ceil(0.5) = 1
	});
});

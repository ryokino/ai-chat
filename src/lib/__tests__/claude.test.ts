import Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Anthropic SDKをモック
vi.mock("@anthropic-ai/sdk", () => {
	return {
		default: vi.fn(),
	};
});

describe("claude", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("Anthropic クライアントが環境変数 ANTHROPIC_API_KEY で初期化される", async () => {
		const originalApiKey = process.env.ANTHROPIC_API_KEY;
		process.env.ANTHROPIC_API_KEY = "test-api-key-12345";

		const mockAnthropicInstance = { test: "instance" };
		vi.mocked(Anthropic).mockImplementation(function (this: any) {
			return mockAnthropicInstance;
		} as any);

		const { anthropic } = await import("../claude");

		expect(Anthropic).toHaveBeenCalledTimes(1);
		expect(Anthropic).toHaveBeenCalledWith({
			apiKey: "test-api-key-12345",
		});
		expect(anthropic).toBe(mockAnthropicInstance);

		process.env.ANTHROPIC_API_KEY = originalApiKey;
	});

	it("ANTHROPIC_API_KEY が未定義の場合でも初期化される", async () => {
		const originalApiKey = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;

		const mockAnthropicInstance = { test: "instance" };
		vi.mocked(Anthropic).mockImplementation(function (this: any) {
			return mockAnthropicInstance;
		} as any);

		const { anthropic } = await import("../claude");

		expect(Anthropic).toHaveBeenCalledTimes(1);
		expect(Anthropic).toHaveBeenCalledWith({
			apiKey: undefined,
		});
		expect(anthropic).toBe(mockAnthropicInstance);

		process.env.ANTHROPIC_API_KEY = originalApiKey;
	});

	it("CLAUDE_MODEL が正しい値を持つ", async () => {
		vi.mocked(Anthropic).mockImplementation(function (this: any) {
			return {};
		} as any);

		const { CLAUDE_MODEL } = await import("../claude");

		expect(CLAUDE_MODEL).toBe("claude-sonnet-4-20250514");
		expect(typeof CLAUDE_MODEL).toBe("string");
	});

	it("anthropic と CLAUDE_MODEL がエクスポートされる", async () => {
		const mockAnthropicInstance = { test: "instance" };
		vi.mocked(Anthropic).mockImplementation(function (this: any) {
			return mockAnthropicInstance;
		} as any);

		const claudeModule = await import("../claude");

		expect(claudeModule).toHaveProperty("anthropic");
		expect(claudeModule).toHaveProperty("CLAUDE_MODEL");
		expect(Object.keys(claudeModule)).toEqual(
			expect.arrayContaining(["anthropic", "CLAUDE_MODEL"]),
		);
	});
});

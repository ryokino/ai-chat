import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AISettings,
	DEFAULT_AI_SETTINGS,
	DEFAULT_MAX_TOKENS,
	DEFAULT_SYSTEM_PROMPT,
	DEFAULT_TEMPERATURE,
	loadSettings,
	MAX_TOKENS_OPTIONS,
	SETTINGS_STORAGE_KEY,
	saveSettings,
} from "./settings";

// localStorage モック
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("settings", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorageMock.clear();
	});

	describe("DEFAULT_AI_SETTINGS", () => {
		it("デフォルトのシステムプロンプトが設定されている", () => {
			expect(DEFAULT_AI_SETTINGS.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT);
			expect(DEFAULT_AI_SETTINGS.systemPrompt).toContain("医学教育");
			expect(DEFAULT_AI_SETTINGS.systemPrompt).toContain("ソクラテス式問答法");
		});

		it("デフォルトのmax_tokensが2048である", () => {
			expect(DEFAULT_AI_SETTINGS.maxTokens).toBe(DEFAULT_MAX_TOKENS);
			expect(DEFAULT_AI_SETTINGS.maxTokens).toBe(2048);
		});

		it("デフォルトのtemperatureが0.3である", () => {
			expect(DEFAULT_AI_SETTINGS.temperature).toBe(DEFAULT_TEMPERATURE);
			expect(DEFAULT_AI_SETTINGS.temperature).toBe(0.3);
		});
	});

	describe("MAX_TOKENS_OPTIONS", () => {
		it("3つのオプションがある", () => {
			expect(MAX_TOKENS_OPTIONS).toHaveLength(3);
		});

		it("1024, 2048, 4096のオプションがある", () => {
			const values = MAX_TOKENS_OPTIONS.map((opt) => opt.value);
			expect(values).toContain(1024);
			expect(values).toContain(2048);
			expect(values).toContain(4096);
		});
	});

	describe("loadSettings", () => {
		it("localStorageに設定がない場合はデフォルト値を返す", () => {
			const settings = loadSettings();
			expect(settings).toEqual(DEFAULT_AI_SETTINGS);
		});

		it("localStorageから保存された設定を読み込む", () => {
			const customSettings: AISettings = {
				systemPrompt: "カスタムプロンプト",
				maxTokens: 4096,
				temperature: 0.7,
			};
			localStorageMock.setItem(
				SETTINGS_STORAGE_KEY,
				JSON.stringify(customSettings),
			);

			const settings = loadSettings();
			expect(settings.systemPrompt).toBe("カスタムプロンプト");
			expect(settings.maxTokens).toBe(4096);
			expect(settings.temperature).toBe(0.7);
		});

		it("部分的に保存された設定はデフォルト値で補完する", () => {
			const partialSettings = {
				systemPrompt: "部分的なプロンプト",
				// maxTokens と temperature が欠けている
			};
			localStorageMock.setItem(
				SETTINGS_STORAGE_KEY,
				JSON.stringify(partialSettings),
			);

			const settings = loadSettings();
			expect(settings.systemPrompt).toBe("部分的なプロンプト");
			expect(settings.maxTokens).toBe(DEFAULT_MAX_TOKENS);
			expect(settings.temperature).toBe(DEFAULT_TEMPERATURE);
		});

		it("不正なJSONの場合はデフォルト値を返す", () => {
			localStorageMock.setItem(SETTINGS_STORAGE_KEY, "invalid json");

			const settings = loadSettings();
			expect(settings).toEqual(DEFAULT_AI_SETTINGS);
		});
	});

	describe("saveSettings", () => {
		it("設定をlocalStorageに保存する", () => {
			const settings: AISettings = {
				systemPrompt: "保存テスト",
				maxTokens: 1024,
				temperature: 0.5,
			};

			saveSettings(settings);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				SETTINGS_STORAGE_KEY,
				JSON.stringify(settings),
			);
		});

		it("保存した設定をloadSettingsで読み込める", () => {
			const settings: AISettings = {
				systemPrompt: "往復テスト",
				maxTokens: 4096,
				temperature: 0.9,
			};

			saveSettings(settings);
			const loaded = loadSettings();

			expect(loaded).toEqual(settings);
		});
	});
});

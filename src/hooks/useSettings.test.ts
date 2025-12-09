import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_AI_SETTINGS,
	loadSettings,
	SETTINGS_STORAGE_KEY,
	saveSettings,
} from "@/lib/settings";
import { useSettings } from "./useSettings";

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

// settings モジュールのモック
vi.mock("@/lib/settings", async () => {
	const actual = await vi.importActual("@/lib/settings");
	return {
		...actual,
		loadSettings: vi.fn(),
		saveSettings: vi.fn(),
	};
});

describe("useSettings", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
		vi.mocked(loadSettings).mockReturnValue(DEFAULT_AI_SETTINGS);
	});

	afterEach(() => {
		localStorageMock.clear();
	});

	it("初期状態でデフォルト設定を返す", () => {
		const { result } = renderHook(() => useSettings());

		expect(result.current.settings).toEqual(DEFAULT_AI_SETTINGS);
	});

	it("マウント後にisLoadedがtrueになる", async () => {
		const { result } = renderHook(() => useSettings());

		// useEffectが実行された後
		await act(async () => {
			// useEffectの実行を待つ
		});

		expect(result.current.isLoaded).toBe(true);
	});

	it("マウント時にlocalStorageから設定を読み込む", async () => {
		const customSettings = {
			systemPrompt: "カスタム",
			maxTokens: 4096,
			temperature: 0.7,
		};
		vi.mocked(loadSettings).mockReturnValue(customSettings);

		const { result } = renderHook(() => useSettings());

		await act(async () => {});

		expect(loadSettings).toHaveBeenCalled();
		expect(result.current.settings).toEqual(customSettings);
	});

	it("updateSettingsで設定を更新できる", async () => {
		const { result } = renderHook(() => useSettings());

		await act(async () => {
			result.current.updateSettings({ temperature: 0.8 });
		});

		expect(result.current.settings.temperature).toBe(0.8);
		expect(saveSettings).toHaveBeenCalled();
	});

	it("updateSettingsで複数の設定を一度に更新できる", async () => {
		const { result } = renderHook(() => useSettings());

		await act(async () => {
			result.current.updateSettings({
				maxTokens: 1024,
				temperature: 0.5,
			});
		});

		expect(result.current.settings.maxTokens).toBe(1024);
		expect(result.current.settings.temperature).toBe(0.5);
	});

	it("resetSettingsでデフォルト設定にリセットできる", async () => {
		const { result } = renderHook(() => useSettings());

		// まず設定を変更
		await act(async () => {
			result.current.updateSettings({
				systemPrompt: "変更済み",
				maxTokens: 4096,
				temperature: 0.9,
			});
		});

		// リセット
		await act(async () => {
			result.current.resetSettings();
		});

		expect(result.current.settings).toEqual(DEFAULT_AI_SETTINGS);
		expect(saveSettings).toHaveBeenLastCalledWith(DEFAULT_AI_SETTINGS);
	});

	it("updateSettingsは他の設定を維持したまま部分的に更新する", async () => {
		const { result } = renderHook(() => useSettings());

		const originalSystemPrompt = result.current.settings.systemPrompt;

		await act(async () => {
			result.current.updateSettings({ temperature: 0.6 });
		});

		expect(result.current.settings.systemPrompt).toBe(originalSystemPrompt);
		expect(result.current.settings.temperature).toBe(0.6);
	});
});

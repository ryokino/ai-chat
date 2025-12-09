"use client";

import { useCallback, useEffect, useState } from "react";
import {
	type AISettings,
	DEFAULT_AI_SETTINGS,
	loadSettings,
	saveSettings,
} from "@/lib/settings";

/**
 * AI設定を管理するカスタムフック
 * @returns 設定値と更新関数
 */
export function useSettings() {
	const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
	const [isLoaded, setIsLoaded] = useState(false);

	// 初回マウント時に LocalStorage から設定を読み込む
	useEffect(() => {
		const loaded = loadSettings();
		setSettings(loaded);
		setIsLoaded(true);
	}, []);

	// 設定を更新する
	const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
		setSettings((prev) => {
			const updated = { ...prev, ...newSettings };
			saveSettings(updated);
			return updated;
		});
	}, []);

	// 設定をリセットする
	const resetSettings = useCallback(() => {
		setSettings(DEFAULT_AI_SETTINGS);
		saveSettings(DEFAULT_AI_SETTINGS);
	}, []);

	return {
		settings,
		isLoaded,
		updateSettings,
		resetSettings,
	};
}

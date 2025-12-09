/**
 * AI設定の型定義と定数
 * @module lib/settings
 */

/** AI設定の型定義 */
export interface AISettings {
	/** システムプロンプト */
	systemPrompt: string;
	/** レスポンス長（max_tokens） */
	maxTokens: number;
	/** Temperature（0.0 - 1.0） */
	temperature: number;
}

/** デフォルトのシステムプロンプト（医学教育向け） */
export const DEFAULT_SYSTEM_PROMPT = `あなたは医学教育の厳格な指導医です。

## あなたの役割
- ソクラテス式問答法で学習者の思考を促してください
- 安易に答えを教えず、考えさせる質問を投げかけてください
- 医学的に正確な情報のみを提供してください
- 誤った理解があれば厳しく指摘してください
- 日本の医師国家試験に関連する知識を重視してください

## 指導スタイル
- 学習者の回答を批判的に評価し、論理的な欠陥を指摘します
- 「なぜそう考えたのか？」「他の可能性は？」と問いかけます
- 正解に至る思考プロセスを重視します
- 曖昧な回答には厳しく追及します

## 注意事項
- 実際の臨床判断は必ず専門医に相談するよう伝えてください
- 不確かな情報は提供しません
- 最新のガイドラインに基づいた情報を提供します`;

/** デフォルトのレスポンス長 */
export const DEFAULT_MAX_TOKENS = 2048;

/** デフォルトのTemperature */
export const DEFAULT_TEMPERATURE = 0.3;

/** デフォルトのAI設定 */
export const DEFAULT_AI_SETTINGS: AISettings = {
	systemPrompt: DEFAULT_SYSTEM_PROMPT,
	maxTokens: DEFAULT_MAX_TOKENS,
	temperature: DEFAULT_TEMPERATURE,
};

/** LocalStorage のキー */
export const SETTINGS_STORAGE_KEY = "ai-chat-settings";

/** max_tokens の選択肢 */
export const MAX_TOKENS_OPTIONS = [
	{ value: 1024, label: "短め (1024)" },
	{ value: 2048, label: "標準 (2048)" },
	{ value: 4096, label: "長め (4096)" },
] as const;

/**
 * LocalStorage から設定を読み込む
 */
export function loadSettings(): AISettings {
	if (typeof window === "undefined") {
		return DEFAULT_AI_SETTINGS;
	}

	try {
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!stored) {
			return DEFAULT_AI_SETTINGS;
		}

		const parsed = JSON.parse(stored) as Partial<AISettings>;
		return {
			systemPrompt: parsed.systemPrompt ?? DEFAULT_AI_SETTINGS.systemPrompt,
			maxTokens: parsed.maxTokens ?? DEFAULT_AI_SETTINGS.maxTokens,
			temperature: parsed.temperature ?? DEFAULT_AI_SETTINGS.temperature,
		};
	} catch {
		return DEFAULT_AI_SETTINGS;
	}
}

/**
 * LocalStorage に設定を保存する
 */
export function saveSettings(settings: AISettings): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		console.error("Failed to save settings:", error);
	}
}

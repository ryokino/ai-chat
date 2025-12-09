/**
 * Web検索ツール
 * Tavily APIを使用したWeb検索機能を提供
 * @module lib/tools/webSearchTool
 */

import { createTool } from "@mastra/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod";

/**
 * 検索結果の型定義
 */
export interface SearchResult {
	title: string;
	url: string;
	content: string;
	score: number;
	publishedDate?: string;
}

/**
 * Web検索ツールの出力型
 */
export interface WebSearchOutput {
	query: string;
	results: SearchResult[];
	answer?: string;
}

/**
 * Tavilyクライアントを初期化
 * 環境変数からAPIキーを取得
 */
const getTavilyClient = () => {
	const apiKey = process.env.TAVILY_API_KEY;
	if (!apiKey) {
		throw new Error("TAVILY_API_KEY is not set in environment variables");
	}
	return tavily({ apiKey });
};

/**
 * Web検索ツール
 * Mastraエージェントから呼び出されるツール
 * ユーザーの質問に関連するWeb情報を検索して返す
 */
export const webSearchTool = createTool({
	id: "web-search",
	description: `Web検索を実行して最新の情報を取得します。
以下のような場合に使用してください：
- 最新のニュースや時事問題について質問された場合
- 特定の事実や統計データを確認する必要がある場合
- ユーザーが「検索して」「調べて」と明示的に依頼した場合
- 医学的な最新情報や研究結果について質問された場合
- あなたの知識が古い可能性がある場合`,
	inputSchema: z.object({
		query: z
			.string()
			.min(1)
			.max(200)
			.describe("検索クエリ（日本語または英語）"),
		searchDepth: z
			.enum(["basic", "advanced"])
			.optional()
			.default("basic")
			.describe("検索の深さ: basicは高速、advancedはより詳細"),
		maxResults: z
			.number()
			.min(1)
			.max(10)
			.optional()
			.default(5)
			.describe("取得する検索結果の最大数"),
	}),
	outputSchema: z.object({
		query: z.string(),
		results: z.array(
			z.object({
				title: z.string(),
				url: z.string(),
				content: z.string(),
				score: z.number(),
				publishedDate: z.string().optional(),
			}),
		),
		answer: z.string().optional(),
	}),
	execute: async ({ context }): Promise<WebSearchOutput> => {
		const { query, searchDepth = "basic", maxResults = 5 } = context;

		try {
			const client = getTavilyClient();

			const response = await client.search(query, {
				searchDepth,
				maxResults,
				includeAnswer: true,
				topic: "general",
			});

			const results: SearchResult[] = response.results.map((result) => ({
				title: result.title || "No title",
				url: result.url,
				content: result.content || "",
				score: result.score || 0,
				publishedDate: result.publishedDate,
			}));

			return {
				query,
				results,
				answer: response.answer,
			};
		} catch (error) {
			console.error("Web search error:", error);
			throw new Error(
				`Web検索に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
});

/**
 * 医療専門検索ツール
 * 医学・医療に特化した検索を行う
 */
export const medicalSearchTool = createTool({
	id: "medical-search",
	description: `医学・医療に特化したWeb検索を実行します。
以下のような場合に使用してください：
- 疾患、症状、治療法について質問された場合
- 医学用語の解説が必要な場合
- 最新の医学研究や臨床試験について質問された場合
- 医師国家試験に関連する情報を検索する場合`,
	inputSchema: z.object({
		query: z.string().min(1).max(200).describe("医学関連の検索クエリ"),
		maxResults: z
			.number()
			.min(1)
			.max(10)
			.optional()
			.default(5)
			.describe("取得する検索結果の最大数"),
	}),
	outputSchema: z.object({
		query: z.string(),
		results: z.array(
			z.object({
				title: z.string(),
				url: z.string(),
				content: z.string(),
				score: z.number(),
				publishedDate: z.string().optional(),
			}),
		),
		answer: z.string().optional(),
	}),
	execute: async ({ context }): Promise<WebSearchOutput> => {
		const { query, maxResults = 5 } = context;

		try {
			const client = getTavilyClient();

			// 医療関連の信頼できるドメインを優先
			const response = await client.search(query, {
				searchDepth: "advanced",
				maxResults,
				includeAnswer: true,
				topic: "general",
				includeDomains: [
					"pubmed.ncbi.nlm.nih.gov",
					"who.int",
					"mhlw.go.jp",
					"jstage.jst.go.jp",
					"medscape.com",
					"uptodate.com",
					"nejm.org",
					"thelancet.com",
				],
			});

			const results: SearchResult[] = response.results.map((result) => ({
				title: result.title || "No title",
				url: result.url,
				content: result.content || "",
				score: result.score || 0,
				publishedDate: result.publishedDate,
			}));

			return {
				query,
				results,
				answer: response.answer,
			};
		} catch (error) {
			console.error("Medical search error:", error);
			throw new Error(
				`医療検索に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
});

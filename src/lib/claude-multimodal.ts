/**
 * Claude API マルチモーダルメッセージ変換ユーティリティ
 * @module lib/claude-multimodal
 */

import type { ImageAttachment } from "@/types/attachment";

/**
 * Claude API のテキストコンテンツ型
 */
export interface ClaudeTextContent {
	type: "text";
	text: string;
}

/**
 * Claude API の画像コンテンツ型
 */
export interface ClaudeImageContent {
	type: "image";
	source: {
		type: "base64";
		media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
		data: string;
	};
}

/**
 * Claude API のコンテンツブロック型（テキストまたは画像）
 */
export type ClaudeContent = ClaudeTextContent | ClaudeImageContent;

/**
 * Claude API のメッセージ型
 */
export interface ClaudeMessage {
	role: "user" | "assistant";
	content: string | ClaudeContent[];
}

/**
 * ImageAttachmentをClaude APIの画像コンテンツ形式に変換
 * @param attachment - 変換する画像添付
 * @returns Claude API形式の画像コンテンツ
 */
export function convertImageToClaude(
	attachment: ImageAttachment,
): ClaudeImageContent {
	// Base64データからプレフィックスを削除（data:image/jpeg;base64, の部分）
	const base64Data = attachment.data.split(",")[1] || attachment.data;

	return {
		type: "image",
		source: {
			type: "base64",
			media_type: attachment.mimeType,
			data: base64Data,
		},
	};
}

/**
 * テキストと画像添付を含むマルチモーダルメッセージをClaude API形式に変換
 * @param text - メッセージテキスト
 * @param attachments - 画像添付の配列（オプション）
 * @returns Claude API形式のコンテンツ（文字列またはコンテンツ配列）
 */
export function convertToClaudeContent(
	text: string,
	attachments?: ImageAttachment[],
): string | ClaudeContent[] {
	// 添付がない場合は単純な文字列を返す
	if (!attachments || attachments.length === 0) {
		return text;
	}

	// 添付がある場合はコンテンツ配列を返す
	const content: ClaudeContent[] = [];

	// テキストがある場合は追加
	if (text.trim()) {
		content.push({
			type: "text",
			text,
		});
	}

	// 画像を追加
	for (const attachment of attachments) {
		content.push(convertImageToClaude(attachment));
	}

	return content;
}

/**
 * 会話履歴をClaude API形式に変換
 * @param messages - 変換するメッセージの配列
 * @returns Claude API形式のメッセージ配列
 */
export function convertMessagesToClaudeFormat(
	messages: Array<{
		role: "user" | "assistant";
		content: string;
		attachments?: ImageAttachment[];
	}>,
): ClaudeMessage[] {
	return messages.map((msg) => ({
		role: msg.role,
		content: convertToClaudeContent(msg.content, msg.attachments),
	}));
}

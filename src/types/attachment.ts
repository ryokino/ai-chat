/**
 * 画像添付の型定義
 * @module types/attachment
 */

/**
 * 画像添付情報
 * メッセージに添付される画像のメタデータとBase64データ
 */
export interface ImageAttachment {
	/** 画像のBase64エンコードデータ（data:image/jpeg;base64,... 形式） */
	data: string;
	/** MIMEタイプ（image/jpeg, image/png, image/webp, image/gif） */
	mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
	/** ファイル名 */
	fileName: string;
	/** ファイルサイズ（バイト） */
	size: number;
	/** 画像の幅（ピクセル） */
	width?: number;
	/** 画像の高さ（ピクセル） */
	height?: number;
}

/**
 * 添付ファイルの配列型
 */
export type Attachments = ImageAttachment[];

/**
 * サポートされている画像MIMEタイプ
 */
export const SUPPORTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
] as const;

/**
 * 最大ファイルサイズ（5MB）
 * Claude APIの制限に準拠
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * 画像ファイルかどうかを判定
 * @param mimeType - チェックするMIMEタイプ
 * @returns 画像ファイルの場合true
 */
export function isImageFile(mimeType: string): boolean {
	return SUPPORTED_IMAGE_TYPES.includes(
		mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number],
	);
}

/**
 * ファイルサイズが制限内かどうかを判定
 * @param size - ファイルサイズ（バイト）
 * @returns 制限内の場合true
 */
export function isValidFileSize(size: number): boolean {
	return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * 画像バリデーションユーティリティ
 * @module lib/image-validation
 */

import {
	type ImageAttachment,
	isImageFile,
	isValidFileSize,
	MAX_FILE_SIZE,
	SUPPORTED_IMAGE_TYPES,
} from "@/types/attachment";

/**
 * バリデーションエラーの型
 */
export interface ValidationError {
	valid: false;
	error: string;
}

/**
 * バリデーション成功の型
 */
export interface ValidationSuccess {
	valid: true;
}

/**
 * バリデーション結果の型
 */
export type ValidationResult = ValidationError | ValidationSuccess;

/**
 * 画像ファイルのバリデーション
 * @param file - バリデーションするファイル
 * @returns バリデーション結果
 */
export function validateImageFile(file: File): ValidationResult {
	// ファイルタイプチェック
	if (!isImageFile(file.type)) {
		return {
			valid: false,
			error: `サポートされていないファイル形式です。対応形式: ${SUPPORTED_IMAGE_TYPES.join(", ")}`,
		};
	}

	// ファイルサイズチェック
	if (!isValidFileSize(file.size)) {
		const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
		return {
			valid: false,
			error: `ファイルサイズが大きすぎます。最大サイズ: ${maxSizeMB}MB`,
		};
	}

	return { valid: true };
}

/**
 * Base64画像データのバリデーション
 * @param base64Data - バリデーションするBase64データ（data:image/...形式）
 * @returns バリデーション結果
 */
export function validateBase64Image(base64Data: string): ValidationResult {
	// Data URL形式チェック
	if (!base64Data.startsWith("data:image/")) {
		return {
			valid: false,
			error: "無効な画像データ形式です",
		};
	}

	// MIMEタイプ抽出
	const mimeTypeMatch = base64Data.match(/^data:(image\/[^;]+);base64,/);
	if (!mimeTypeMatch) {
		return {
			valid: false,
			error: "無効なBase64画像データです",
		};
	}

	const mimeType = mimeTypeMatch[1];
	if (!isImageFile(mimeType)) {
		return {
			valid: false,
			error: `サポートされていないファイル形式です: ${mimeType}`,
		};
	}

	// Base64データサイズチェック（エンコード後のサイズを概算）
	const base64Content = base64Data.split(",")[1];
	if (!base64Content) {
		return {
			valid: false,
			error: "無効なBase64データです",
		};
	}

	// Base64デコード後のサイズを概算（Base64は約1.33倍のサイズ）
	const estimatedSize = (base64Content.length * 3) / 4;
	if (!isValidFileSize(estimatedSize)) {
		const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
		return {
			valid: false,
			error: `ファイルサイズが大きすぎます。最大サイズ: ${maxSizeMB}MB`,
		};
	}

	return { valid: true };
}

/**
 * ファイルをBase64に変換
 * @param file - 変換するファイル
 * @returns Base64エンコードされた画像データのPromise
 */
export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
			} else {
				reject(new Error("Failed to convert file to base64"));
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

/**
 * 画像の寸法を取得
 * @param base64Data - Base64エンコードされた画像データ
 * @returns 画像の幅と高さのPromise
 */
export function getImageDimensions(
	base64Data: string,
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
		};
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = base64Data;
	});
}

/**
 * FileオブジェクトからImageAttachmentを作成
 * @param file - 画像ファイル
 * @returns ImageAttachmentのPromise
 */
export async function createImageAttachment(
	file: File,
): Promise<ImageAttachment> {
	const validation = validateImageFile(file);
	if (!validation.valid) {
		throw new Error(validation.error);
	}

	const base64Data = await fileToBase64(file);
	const dimensions = await getImageDimensions(base64Data);

	return {
		data: base64Data,
		mimeType: file.type as ImageAttachment["mimeType"],
		fileName: file.name,
		size: file.size,
		width: dimensions.width,
		height: dimensions.height,
	};
}

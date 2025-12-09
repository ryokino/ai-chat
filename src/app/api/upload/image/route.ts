/**
 * 画像アップロード API
 * クライアントから送信された画像をバリデーションし、Base64データを返却
 * @module api/upload/image
 */

import type { NextRequest } from "next/server";
import { validateBase64Image } from "@/lib/image-validation";
import type { ImageAttachment } from "@/types/attachment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * アップロードリクエストボディの型
 */
interface UploadRequestBody {
	/** Base64エンコードされた画像データ */
	imageData: string;
	/** ファイル名 */
	fileName: string;
	/** ファイルサイズ（バイト） */
	size: number;
	/** 画像の幅（オプション） */
	width?: number;
	/** 画像の高さ（オプション） */
	height?: number;
}

/**
 * 画像アップロードエンドポイント
 * クライアントから画像データを受け取り、バリデーション後に保存可能な形式で返却
 *
 * @param request - Next.js リクエストオブジェクト
 * @returns バリデーション済みの画像情報
 *
 * @example
 * // クライアントからのリクエスト
 * fetch("/api/upload/image", {
 *   method: "POST",
 *   body: JSON.stringify({
 *     imageData: "data:image/jpeg;base64,...",
 *     fileName: "photo.jpg",
 *     size: 102400,
 *   }),
 * });
 */
export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as UploadRequestBody;
		const { imageData, fileName, size, width, height } = body;

		// 必須フィールドチェック
		if (!imageData || !fileName || !size) {
			return new Response(
				JSON.stringify({
					error: "imageData, fileName, and size are required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 画像データのバリデーション
		const validation = validateBase64Image(imageData);
		if (!validation.valid) {
			return new Response(
				JSON.stringify({
					error: validation.error,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// MIMEタイプ抽出
		const mimeTypeMatch = imageData.match(/^data:(image\/[^;]+);base64,/);
		if (!mimeTypeMatch) {
			return new Response(
				JSON.stringify({
					error: "Invalid image data format",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const mimeType = mimeTypeMatch[1] as ImageAttachment["mimeType"];

		// ImageAttachmentオブジェクトを作成
		const attachment: ImageAttachment = {
			data: imageData,
			mimeType,
			fileName,
			size,
			width,
			height,
		};

		// レスポンスを返却
		return new Response(
			JSON.stringify({
				success: true,
				attachment,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Image upload error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Internal server error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

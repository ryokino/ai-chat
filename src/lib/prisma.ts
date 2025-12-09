/**
 * Prisma クライアント設定
 * シングルトンパターンでインスタンスを管理
 * @module lib/prisma
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables from .env.local with override
dotenv.config({ path: ".env.local", override: true });

/** グローバルスコープでのPrismaクライアント保持用 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Prisma クライアントインスタンス
 * 開発環境ではホットリロード時の再接続を防ぐためグローバルに保持
 * @example
 * import { prisma } from "@/lib/prisma";
 * const users = await prisma.user.findMany();
 */
export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		datasources: {
			db: {
				url: process.env.DATABASE_URL,
			},
		},
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

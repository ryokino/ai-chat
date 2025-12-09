import { PrismaClient } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// PrismaClientをモック
vi.mock("@prisma/client", () => ({
	PrismaClient: vi.fn(),
}));

// dotenvをモック
vi.mock("dotenv", () => ({
	default: {
		config: vi.fn(),
	},
}));

describe("prisma", () => {
	// 各テスト前にモジュールキャッシュとグローバル変数をクリア
	beforeEach(() => {
		vi.resetModules();
		// グローバル変数をクリア
		const globalForPrisma = global as unknown as { prisma?: PrismaClient };
		delete globalForPrisma.prisma;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("PrismaClient インスタンスが作成される", async () => {
		const mockPrismaInstance = {};
		vi.mocked(PrismaClient).mockImplementation(function (this: any) {
			return mockPrismaInstance;
		} as any);

		const { prisma } = await import("../prisma");

		expect(PrismaClient).toHaveBeenCalledTimes(1);
		expect(PrismaClient).toHaveBeenCalledWith({
			datasources: {
				db: {
					url: process.env.DATABASE_URL,
				},
			},
		});
		expect(prisma).toBe(mockPrismaInstance);
	});

	it("開発環境ではグローバルにPrismaインスタンスを保持する", async () => {
		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		const mockPrismaInstance = {};
		vi.mocked(PrismaClient).mockImplementation(function (this: any) {
			return mockPrismaInstance;
		} as any);

		const { prisma } = await import("../prisma");

		const globalForPrisma = global as unknown as { prisma: PrismaClient };
		expect(globalForPrisma.prisma).toBe(prisma);
		expect(globalForPrisma.prisma).toBe(mockPrismaInstance);

		process.env.NODE_ENV = originalNodeEnv;
	});

	it("本番環境ではグローバルにPrismaインスタンスを保持しない", async () => {
		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";

		const mockPrismaInstance = {};
		vi.mocked(PrismaClient).mockImplementation(function (this: any) {
			return mockPrismaInstance;
		} as any);

		await import("../prisma");

		const globalForPrisma = global as unknown as { prisma?: PrismaClient };
		expect(globalForPrisma.prisma).toBeUndefined();

		process.env.NODE_ENV = originalNodeEnv;
	});

	it("グローバルインスタンスが存在する場合は再利用する", async () => {
		const existingPrismaInstance = { existing: true };
		const globalForPrisma = global as unknown as { prisma: PrismaClient };
		globalForPrisma.prisma = existingPrismaInstance as any;

		vi.mocked(PrismaClient).mockImplementation(() => ({ new: true }) as any);

		const { prisma } = await import("../prisma");

		// 新しいインスタンスは作成されない
		expect(PrismaClient).not.toHaveBeenCalled();
		// 既存のインスタンスが返される
		expect(prisma).toBe(existingPrismaInstance);
	});

	it("dotenv.config が .env.local で呼ばれる", async () => {
		const mockPrismaInstance = {};
		vi.mocked(PrismaClient).mockImplementation(function (this: any) {
			return mockPrismaInstance;
		} as any);

		const dotenv = await import("dotenv");

		await import("../prisma");

		expect(dotenv.default.config).toHaveBeenCalledWith({
			path: ".env.local",
			override: true,
		});
	});
});

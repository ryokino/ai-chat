import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables from .env.local with override
dotenv.config({ path: ".env.local", override: true });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

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

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

// Enable SQLite WAL mode & performance PRAGMAs for high-concurrency webhook ingestion
if (typeof window === 'undefined') {
  prisma.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`).catch(() => {});
  prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`).catch(() => {});
  prisma.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`).catch(() => {});
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

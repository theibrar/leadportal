import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

// Enable SQLite WAL mode & maximum performance PRAGMAs for sub-millisecond queries
if (typeof window === 'undefined') {
  prisma.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`).catch(() => {});
  prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`).catch(() => {});
  prisma.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`).catch(() => {});
  prisma.$executeRawUnsafe(`PRAGMA temp_store = MEMORY;`).catch(() => {});
  prisma.$executeRawUnsafe(`PRAGMA cache_size = -64000;`).catch(() => {}); // 64MB cache
  prisma.$executeRawUnsafe(`PRAGMA mmap_size = 268435456;`).catch(() => {}); // 256MB memory map
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

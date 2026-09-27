import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : [],
  })

// SQLite-only concurrency hardening (skipped for PostgreSQL).
// WAL allows concurrent readers alongside one writer (kiosk polling + log
// writes), busy_timeout makes brief lock waits block instead of failing.
const walInit = (async () => {
  try {
    if (!(process.env.DATABASE_URL ?? '').startsWith('file:')) return;
    // NOTE: SQLite PRAGMA statements report result rows through this driver,
    // so all of them must use queryRaw (executeRaw throws P2010).
    await db.$queryRawUnsafe('PRAGMA busy_timeout=5000');
    await db.$queryRawUnsafe('PRAGMA synchronous=NORMAL');
    await db.$queryRawUnsafe('PRAGMA journal_mode=WAL');
  } catch (error) {
    console.error('SQLite WAL init failed:', error);
  }
})();

void walInit;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
/**
 * Retention cleanup for ever-growing tables.
 *
 *   KIOSK_LOG_RETENTION_DAYS=90 AUDIT_LOG_RETENTION_DAYS=365 bun prisma/retention.ts
 *   (package.json: bun run db:retention)
 *
 * Run from cron/PM2 on the deployment host. Deletes in small batches to
 * avoid long transactions on PostgreSQL.
 */
import { PrismaClient } from '@prisma/client';

const KIOSK_DAYS = Math.max(1, parseInt(process.env.KIOSK_LOG_RETENTION_DAYS ?? '90'));
const AUDIT_DAYS = Math.max(1, parseInt(process.env.AUDIT_LOG_RETENTION_DAYS ?? '365'));
const BATCH = 1000;

const db = new PrismaClient();

async function deleteOld(
  label: string,
  cutoff: Date,
  deleter: (c: Date) => Promise<{ count: number }>
) {
  let total = 0;
  for (;;) {
    const ids = await deleter(cutoff);
    total += ids.count;
    if (ids.count < BATCH) break;
  }
  console.log(`${label}: deleted ${total} rows older than ${cutoff.toISOString()}`);
}

async function main() {
  const now = Date.now();
  await deleteOld(
    'KioskLog',
    new Date(now - KIOSK_DAYS * 24 * 60 * 60 * 1000),
    async (cutoff) => {
      const rows = await db.kioskLog.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true },
        take: BATCH,
      });
      if (rows.length === 0) return { count: 0 };
      const res = await db.kioskLog.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
      return res;
    }
  );
  await deleteOld(
    'AuditLog',
    new Date(now - AUDIT_DAYS * 24 * 60 * 60 * 1000),
    async (cutoff) => {
      const rows = await db.auditLog.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true },
        take: BATCH,
      });
      if (rows.length === 0) return { count: 0 };
      const res = await db.auditLog.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
      return res;
    }
  );
  console.log('retention done');
}

main()
  .catch((e) => {
    console.error('retention failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

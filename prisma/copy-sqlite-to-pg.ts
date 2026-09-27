/**
 * One-time SQLite → PostgreSQL data migration.
 *
 *   SQLITE_URL="file:/abs/path/db/custom.db" \
 *   DATABASE_URL="postgresql://user:pass@localhost:5432/biogram?schema=public" \
 *   bun prisma/copy-sqlite-to-pg.ts
 *
 * Copies all business data (ids preserved, FK-safe order). Skips AdminSession
 * (ephemeral). Missing tables (e.g. models added after the SQLite era) are
 * skipped gracefully. Idempotent: uses upsert by id.
 */
import { PrismaClient as Pg } from '@prisma/client';
import { PrismaClient as Lite } from '../src/generated/sqlite-client';

const pg = new Pg();
const lite = new Lite();

async function copyTable<T extends { id: string }>(
  name: string,
  read: () => Promise<T[]>,
  write: (row: T) => Promise<unknown>,
) {
  let rows: T[];
  try {
    rows = await read();
  } catch (e) {
    console.log(`⏭️ ${name}: source table missing, skipped`);
    return 0;
  }
  let n = 0;
  for (const row of rows) {
    await write(row);
    n += 1;
  }
  console.log(`✅ ${name}: ${n} rows`);
  return n;
}

async function main() {
  if (!process.env.SQLITE_URL) throw new Error('SQLITE_URL must be set');
  console.log('From:', process.env.SQLITE_URL);

  const withoutId = <T extends { id: string }>({ id: _id, ...rest }: T) => rest;

  await copyTable('AdminUser', () => lite.adminUser.findMany(), (r) =>
    pg.adminUser.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('KioskContent', () => lite.kioskContent.findMany(), (r) =>
    pg.kioskContent.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('ContentSection', () => lite.contentSection.findMany(), (r) =>
    pg.contentSection.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('MeasurementItem', () => lite.measurementItem.findMany(), (r) =>
    pg.measurementItem.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('MeasurementEquipment', () => lite.measurementEquipment.findMany(), (r) =>
    pg.measurementEquipment.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('UploadedImage', () => lite.uploadedImage.findMany(), (r) =>
    pg.uploadedImage.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('PwaIcon', () => lite.pwaIcon.findMany(), (r) =>
    pg.pwaIcon.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('AuditLog', () => lite.auditLog.findMany(), (r) =>
    pg.auditLog.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );
  await copyTable('KioskLog', () => lite.kioskLog.findMany(), (r) =>
    pg.kioskLog.upsert({ where: { id: r.id }, create: r, update: withoutId(r) })
  );

  console.log('🎉 copy done (AdminSession skipped by design)');
}

main()
  .catch((e) => {
    console.error('copy failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await lite.$disconnect();
    await pg.$disconnect();
  });

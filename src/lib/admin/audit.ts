import { db } from '@/lib/db';

interface AuditParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  before,
  after,
}: AuditParams): Promise<void> {
  const changes: Record<string, unknown> = {};
  if (before !== undefined) changes.before = before;
  if (after !== undefined) changes.after = after;

  await db.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      changes: JSON.stringify(changes),
    },
  });
}

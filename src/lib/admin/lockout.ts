import { db } from '@/lib/db';

export const MAX_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface LockoutStatus {
  locked: boolean;
  remainingMs?: number;
}

export async function checkLockout(email: string): Promise<LockoutStatus> {
  const user = await db.adminUser.findUnique({
    where: { email },
    select: { lockedUntil: true },
  });

  if (!user || !user.lockedUntil) {
    return { locked: false };
  }

  const now = new Date();
  if (user.lockedUntil > now) {
    return {
      locked: true,
      remainingMs: user.lockedUntil.getTime() - now.getTime(),
    };
  }

  // Lock has expired
  return { locked: false };
}

export async function recordFailedAttempt(email: string): Promise<void> {
  const user = await db.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return; // Don't reveal whether user exists

  // Atomic increment to prevent race-condition lockout bypass
  const updated = await db.adminUser.update({
    where: { id: user.id },
    data: { failedAttempts: { increment: 1 } },
    select: { failedAttempts: true },
  });

  if (updated.failedAttempts >= MAX_ATTEMPTS) {
    await db.adminUser.update({
      where: { id: user.id },
      data: { lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) },
    });
  }
}

export async function resetFailedAttempts(userId: string): Promise<void> {
  await db.adminUser.update({
    where: { id: userId },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

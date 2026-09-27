import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { verifyPassword, hashPassword, rejectBreachedPassword } from '@/lib/admin/password';
import { createUserSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';

// Reuse the creation-time complexity policy for changes
const newPasswordSchema = createUserSchema.shape.password;

const changeSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
  newPassword: newPasswordSchema,
});

// POST /api/admin/auth/change-password - Self password change.
// Allowed even when mustChangePassword is set (see middleware allowlist).
export const POST = withAuth('content:read', async (request: NextRequest, _context, auth) => {
  try {
    const body = await request.json();
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await db.adminUser.findUnique({ where: { id: auth.userId } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: '비활성화된 계정입니다' }, { status: 401 });
    }

    const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      await logAudit({ userId: user.id, action: 'password_change_failed', entity: 'AdminUser', entityId: user.id });
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다', code: 'INVALID_CURRENT' },
        { status: 401 }
      );
    }

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return NextResponse.json(
        { error: '새 비밀번호는 현재 비밀번호와 달라야 합니다' },
        { status: 400 }
      );
    }

    try {
      await rejectBreachedPassword(parsed.data.newPassword);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : '비밀번호를 사용할 수 없습니다' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db.adminUser.update({
      where: { id: user.id },
      data: { passwordHash, failedAttempts: 0, lockedUntil: null, mustChangePassword: false },
    });

    // Keep only the current session; revoke everything else (stolen sessions die)
    const token = (request as NextRequest).cookies.get('__Host-admin_session')?.value
      ?? (request as NextRequest).cookies.get('admin_session')?.value;
    await db.adminSession.deleteMany({
      where: { userId: user.id, ...(token ? { token: { not: token } } : {}) },
    });

    await logAudit({ userId: user.id, action: 'password_changed', entity: 'AdminUser', entityId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

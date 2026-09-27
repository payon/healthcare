import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { logAudit } from '@/lib/admin/audit';
import type { Role } from '@/lib/admin/rbac';

type RouteContext = { params: Promise<Record<string, string>> };

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  superadmin: 3,
};

// DELETE /api/admin/users/[id]/2fa - Reset TOTP for a user (lost device).
// Requires users:role; cannot target equal-or-higher rank.
export const DELETE = withAuth('users:role', async (_request: NextRequest, context: RouteContext, auth) => {
  try {
    const { id } = (await context.params) as { id: string };

    if (id === auth.userId) {
      return NextResponse.json(
        { error: '자신의 2FA는 보안 설정에서 직접 해제하세요', code: 'FORBIDDEN' },
        { status: 400 }
      );
    }

    const existing = await db.adminUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const callerRole = auth.role as Role;
    if (ROLE_RANK[existing.role as Role] >= ROLE_RANK[callerRole]) {
      return NextResponse.json(
        { error: '대상 계정에 대한 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await db.adminUser.update({
      where: { id },
      data: { totpEnabled: false, totpSecret: null, mustChangePassword: true },
    });
    await db.adminSession.deleteMany({ where: { userId: id } });

    await logAudit({
      userId: auth.userId,
      action: '2fa_reset',
      entity: 'AdminUser',
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA reset error:', error);
    return NextResponse.json(
      { error: '2FA 초기화 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

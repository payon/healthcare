import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTokenFromCookies, clearSessionCookie, verifySession } from '@/lib/admin/auth';
import { isOriginAllowed } from '@/lib/admin/csrf';
import { logAudit } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  try {
    if (!isOriginAllowed(request)) {
      return NextResponse.json(
        { error: '허용되지 않은 출처입니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const token = getTokenFromCookies((name) => request.cookies.get(name)?.value);

    if (token) {
      // Verify session to get userId for audit
      const payload = await verifySession(token);

      // Delete session from DB
      await db.adminSession.deleteMany({ where: { token } }).catch(() => {});

      // Audit log
      if (payload) {
        await logAudit({
          userId: payload.userId,
          action: 'logout',
          entity: 'AdminSession',
        });
      }
    }

    const response = NextResponse.json({ success: true });
    return clearSessionCookie(response);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/admin/schemas';
import { verifyPassword } from '@/lib/admin/password';
import { createSession, setSessionCookie, isSecureRequest } from '@/lib/admin/auth';
import { checkLockout, recordFailedAttempt, resetFailedAttempts } from '@/lib/admin/lockout';
import { logAudit } from '@/lib/admin/audit';
import { checkRateLimit, getClientIp } from '@/lib/admin/rate-limit';
import { isOriginAllowed } from '@/lib/admin/csrf';

const GENERIC_ERROR = '이메일 또는 비밀번호가 올바르지 않습니다';

export async function POST(request: NextRequest) {
  try {
    if (!isOriginAllowed(request)) {
      return NextResponse.json(
        { error: '허용되지 않은 출처입니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rl = checkRateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const lockout = await checkLockout(email);
    if (lockout.locked) {
      await logAudit({ action: 'login_locked', entity: 'AdminSession', entityId: email });
      const remainingMin = Math.ceil((lockout.remainingMs ?? 0) / 60000);
      return NextResponse.json(
        { error: `계정이 잠겼습니다. ${remainingMin}분 후에 다시 시도하세요`, code: 'LOCKED' },
        { status: 423 }
      );
    }

    const user = await db.adminUser.findUnique({ where: { email } });

    // Generic response to avoid user enumeration (timing differences minimized)
    if (!user || !user.isActive) {
      if (user && !user.isActive) {
        await logAudit({ userId: user.id, action: 'login_disabled', entity: 'AdminSession' });
      } else {
        await recordFailedAttempt(email);
        await logAudit({ action: 'login_failed', entity: 'AdminSession', entityId: email });
      }
      return NextResponse.json(
        { error: GENERIC_ERROR, code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await recordFailedAttempt(email);
      await logAudit({ userId: user.id, action: 'login_failed', entity: 'AdminSession' });
      return NextResponse.json(
        { error: GENERIC_ERROR, code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    const token = await createSession(user.id, user.role as 'superadmin' | 'admin' | 'editor' | 'viewer');

    await resetFailedAttempts(user.id);

    await logAudit({ userId: user.id, action: 'login', entity: 'AdminSession' });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, lastLoginAt: new Date() },
    });

    return setSessionCookie(response, token, isSecureRequest(request));
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

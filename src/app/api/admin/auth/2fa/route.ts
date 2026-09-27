import * as OTPAuth from 'otpauth';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, setSessionCookie, isSecureRequest } from '@/lib/admin/auth';
import { resetFailedAttempts } from '@/lib/admin/lockout';
import { logAudit } from '@/lib/admin/audit';
import { checkRateLimit, getClientIp } from '@/lib/admin/rate-limit';
import { isOriginAllowed } from '@/lib/admin/csrf';

const challengeSchema = z.object({
  challenge: z.string().min(1),
  token: z.string().regex(/^\d{6,8}$/, '6자리 코드를 입력하세요'),
});

// POST /api/admin/auth/2fa - Complete login with TOTP token + challenge
export async function POST(request: NextRequest) {
  try {
    if (!isOriginAllowed(request)) {
      return NextResponse.json(
        { error: '허용되지 않은 출처입니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rl = checkRateLimit(`2fa-login:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: '요청이 너무 많습니다' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = challengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error('JWT_SECRET is not configured');

    let userId: string;
    try {
      const { payload } = await jwtVerify(parsed.data.challenge, new TextEncoder().encode(secret));
      if (payload.purpose !== '2fa' || typeof payload.sub !== 'string') throw new Error('bad challenge');
      userId = payload.sub;
    } catch {
      return NextResponse.json(
        { error: '인증 요청이 만료되었습니다. 다시 로그인하세요', code: 'CHALLENGE_EXPIRED' },
        { status: 401 }
      );
    }

    const user = await db.adminUser.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || !user.totpEnabled || !user.totpSecret) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'BiogramMINI',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
    });
    const delta = totp.validate({ token: parsed.data.token, window: 1 });
    if (delta === null) {
      await logAudit({ userId: user.id, action: 'login_2fa_failed', entity: 'AdminSession' });
      return NextResponse.json(
        { error: '코드가 올바르지 않습니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const token = await createSession(user.id, user.role as 'superadmin' | 'admin' | 'editor' | 'viewer');
    await resetFailedAttempts(user.id);
    await logAudit({ userId: user.id, action: 'login', entity: 'AdminSession' });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        totpEnabled: user.totpEnabled,
        lastLoginAt: new Date(),
      },
    });
    return setSessionCookie(response, token, isSecureRequest(request));
  } catch (error) {
    console.error('2FA login error:', error);
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

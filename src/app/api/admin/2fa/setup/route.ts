import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/admin/audit';
import { checkRateLimit, getClientIp } from '@/lib/admin/rate-limit';
import { z } from 'zod';

const tokenSchema = z.object({
  token: z.string().regex(/^\d{6,8}$/, '6자리 코드를 입력하세요'),
});

// POST /api/admin/2fa/setup - Start TOTP setup (returns secret + QR, not yet enabled)
export const POST = withAuth('content:read', async (request: NextRequest, _context, auth) => {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`2fa:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다' }, { status: 429 });
  }

  try {
    const user = await db.adminUser.findUnique({ where: { id: auth.userId } });
    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    if (user.totpEnabled) {
      return NextResponse.json({ error: '이미 2단계 인증이 켜져 있습니다' }, { status: 400 });
    }

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'BiogramMINI',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });
    const otpauthUrl = totp.toString();

    await db.adminUser.update({
      where: { id: auth.userId },
      data: { totpSecret: secret.base32 },
    });

    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    await logAudit({ userId: auth.userId, action: '2fa_setup_start', entity: 'AdminUser', entityId: auth.userId });

    return NextResponse.json({ otpauthUrl, qrDataUrl });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: '2FA 설정 중 오류가 발생했습니다' }, { status: 500 });
  }
});

// PUT /api/admin/2fa/setup - Verify code to enable TOTP
export const PUT = withAuth('content:read', async (request: NextRequest, _context, auth) => {
  try {
    const body = await request.json();
    const parsed = tokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 });
    }

    const user = await db.adminUser.findUnique({ where: { id: auth.userId } });
    if (!user?.totpSecret) {
      return NextResponse.json({ error: '먼저 설정을 시작하세요' }, { status: 400 });
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
      await logAudit({ userId: auth.userId, action: '2fa_setup_failed', entity: 'AdminUser', entityId: auth.userId });
      return NextResponse.json({ error: '코드가 올바르지 않습니다', code: 'INVALID_TOKEN' }, { status: 401 });
    }

    await db.adminUser.update({
      where: { id: auth.userId },
      data: { totpEnabled: true },
    });
    await logAudit({ userId: auth.userId, action: '2fa_enabled', entity: 'AdminUser', entityId: auth.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json({ error: '2FA 활성화 중 오류가 발생했습니다' }, { status: 500 });
  }
});

// DELETE /api/admin/2fa/setup - Disable TOTP for self
export const DELETE = withAuth('content:read', async (_request: NextRequest, context, auth) => {
  try {
    await db.adminUser.update({
      where: { id: auth.userId },
      data: { totpEnabled: false, totpSecret: null },
    });
    await logAudit({ userId: auth.userId, action: '2fa_disabled', entity: 'AdminUser', entityId: auth.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: '2FA 해제 중 오류가 발생했습니다' }, { status: 500 });
  }
});

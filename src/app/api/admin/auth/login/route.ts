import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/admin/schemas';
import { verifyPassword } from '@/lib/admin/password';
import { createSession, setSessionCookie } from '@/lib/admin/auth';
import { checkLockout, recordFailedAttempt, resetFailedAttempts } from '@/lib/admin/lockout';
import { logAudit } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check lockout
    const lockout = await checkLockout(email);
    if (lockout.locked) {
      const remainingMin = Math.ceil((lockout.remainingMs ?? 0) / 60000);
      return NextResponse.json(
        { error: `계정이 잠겼습니다. ${remainingMin}분 후에 다시 시도하세요`, code: 'LOCKED' },
        { status: 423 }
      );
    }

    // Find user
    const user = await db.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      await recordFailedAttempt(email);
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: '비활성화된 계정입니다', code: 'ACCOUNT_DISABLED' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await recordFailedAttempt(email);
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id, user.role as 'superadmin' | 'admin' | 'editor' | 'viewer');

    // Reset failed attempts on successful login
    await resetFailedAttempts(user.id);

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'login',
      entity: 'AdminSession',
    });

    // Return user info without password hash
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: new Date(),
      },
    });

    return setSessionCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

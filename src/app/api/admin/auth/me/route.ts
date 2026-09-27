import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getTokenFromCookies } from '@/lib/admin/auth';
import { db } from '@/lib/db';

/**
 * GET /api/admin/auth/me
 * Returns current authenticated user or null.
 * Uses 200 with { user: null } for unauthenticated state instead of 401
 * to avoid console errors from browser's "Failed to load resource" logging.
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies((name) => request.cookies.get(name)?.value);

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifySession(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const user = await db.adminUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        totpEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: '사용자 정보를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

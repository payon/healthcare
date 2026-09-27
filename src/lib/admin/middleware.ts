import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getTokenFromCookies } from './auth';
import { isOriginAllowed } from './csrf';
import { hasPermission, type Role, type Permission } from './rbac';
import { db } from '@/lib/db';

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

interface AuthContext {
  userId: string;
  role: Role;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  auth: AuthContext
) => Promise<NextResponse> | NextResponse;

export function withAuth(permission: Permission, handler: AuthenticatedHandler): RouteHandler {
  return async (request, context) => {
    try {
      // CSRF check for state-changing methods (defense-in-depth alongside SameSite)
      if (!isOriginAllowed(request)) {
        return NextResponse.json(
          { error: '허용되지 않은 출처입니다', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Get token from cookie (secure or plain name)
      const token = getTokenFromCookies((name) => request.cookies.get(name)?.value);

      if (!token) {
        return NextResponse.json(
          { error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Verify session
      const payload = await verifySession(token);
      if (!payload) {
        return NextResponse.json(
          { error: '세션이 만료되었습니다', code: 'SESSION_EXPIRED' },
          { status: 401 }
        );
      }

      // Check user is still active
      const user = await db.adminUser.findUnique({
        where: { id: payload.userId },
        select: { isActive: true, role: true },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: '비활성화된 계정입니다', code: 'ACCOUNT_DISABLED' },
          { status: 401 }
        );
      }

      // Check permission
      if (!hasPermission(user.role as Role, permission)) {
        return NextResponse.json(
          { error: '권한이 없습니다', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Call handler with auth context
      return handler(request, context, {
        userId: payload.userId,
        role: user.role as Role,
      });
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

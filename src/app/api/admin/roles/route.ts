import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { ROLE_PERMISSIONS, type Role, type Permission } from '@/lib/admin/rbac';

// GET /api/admin/roles - Returns role list with permissions
export const GET = withAuth('users:read', async (_request, _context, _auth) => {
  try {
    const roles: { role: Role; permissions: Permission[] }[] = (
      Object.entries(ROLE_PERMISSIONS) as [Role, Permission[]][]
    ).map(([role, permissions]) => ({
      role,
      permissions,
    }));

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: '역할 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

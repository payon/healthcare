import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { createUserSchema } from '@/lib/admin/schemas';
import { hashPassword } from '@/lib/admin/password';
import { logAudit } from '@/lib/admin/audit';
import { hasPermission, type Role } from '@/lib/admin/rbac';

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  superadmin: 3,
};

// GET /api/admin/users - List users with pagination
export const GET = withAuth('users:read', async (request, _context, _auth) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')));
    const role = url.searchParams.get('role') ?? undefined;
    const search = url.searchParams.get('search') ?? undefined;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      const q = String(search).slice(0, 100);
      where.OR = [
        // PostgreSQL LIKE is case-sensitive → insensitive search like before
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      db.adminUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.adminUser.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: '사용자 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// POST /api/admin/users - Create user
export const POST = withAuth('users:write', async (request, _context, auth) => {
  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, role } = parsed.data;
    const callerRole = auth.role as Role;

    // Privilege escalation guard: assigning admin/superadmin requires users:role,
    // and caller cannot create a role equal to or higher than their own.
    if (role === 'superadmin' || role === 'admin') {
      if (!hasPermission(callerRole, 'users:role')) {
        return NextResponse.json(
          { error: '해당 역할을 부여할 권한이 없습니다', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }
    if (ROLE_RANK[role as Role] >= ROLE_RANK[callerRole]) {
      return NextResponse.json(
        { error: '자신과 같거나 높은 역할은 생성할 수 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.adminUser.create({
      data: { email, passwordHash, name, role },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    await logAudit({
      userId: auth.userId,
      action: 'create',
      entity: 'AdminUser',
      entityId: user.id,
      after: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: '사용자 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

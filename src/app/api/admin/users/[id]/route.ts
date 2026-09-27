import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { updateUserSchema } from '@/lib/admin/schemas';
import { hashPassword, rejectBreachedPassword } from '@/lib/admin/password';
import { logAudit } from '@/lib/admin/audit';
import { hasPermission, type Role } from '@/lib/admin/rbac';
import { revokeUserSessions } from '@/lib/admin/auth';

type RouteContext = { params: Promise<{ id: string }> };

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  superadmin: 3,
};

// GET /api/admin/users/[id] - Single user detail (minimal fields)
export const GET = withAuth('users:read', async (_request, context, _auth) => {
  try {
    const { id } = await context.params;

    const user = await db.adminUser.findUnique({
      where: { id },
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
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '사용자 정보를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/users/[id] - Update user with hierarchy enforcement
export const PUT = withAuth('users:write', async (request, context, auth) => {
  try {
    const { id } = await context.params;

    const existing = await db.adminUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const callerRole = auth.role as Role;
    const targetRole = existing.role as Role;

    // Cannot touch users at equal-or-higher rank (except self name/password)
    const isSelf = id === auth.userId;
    if (!isSelf && ROLE_RANK[targetRole] >= ROLE_RANK[callerRole]) {
      return NextResponse.json(
        { error: '대상 계정에 대한 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Sensitive fields require users:role
    const touchesSensitive =
      data.role !== undefined ||
      data.email !== undefined ||
      data.isActive !== undefined ||
      data.password !== undefined;
    if (touchesSensitive && !isSelf && !hasPermission(callerRole, 'users:role')) {
      return NextResponse.json(
        { error: '민감 정보 변경 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Self role/isActive change is never allowed here
    if (isSelf && (data.role !== undefined || data.isActive !== undefined)) {
      return NextResponse.json(
        { error: '자신의 역할/상태는 변경할 수 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // New role must be strictly below caller
    if (data.role !== undefined && ROLE_RANK[data.role as Role] >= ROLE_RANK[callerRole]) {
      return NextResponse.json(
        { error: '자신과 같거나 높은 역할로 변경할 수 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await db.adminUser.findUnique({ where: { email: data.email } });
      if (emailExists) {
        return NextResponse.json(
          { error: '이미 존재하는 이메일입니다', code: 'DUPLICATE_EMAIL' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined && !isSelf) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    let credentialChanged = false;
    if (data.password !== undefined) {
      try {
        await rejectBreachedPassword(data.password);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : '비밀번호를 사용할 수 없습니다' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(data.password);
      credentialChanged = true;
    }
    if (data.isActive === false || data.role !== undefined) credentialChanged = true;

    const user = await db.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    });

    // Revoke sessions on credential / role / deactivation change
    if (credentialChanged) {
      await db.adminSession.deleteMany({ where: { userId: id } });
    }

    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'AdminUser',
      entityId: id,
      before: { name: existing.name, email: existing.email, role: existing.role, isActive: existing.isActive },
      after: user,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: '사용자 수정 중 오류가 발생했습니다' }, { status: 500 });
  }
});

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export const DELETE = withAuth('users:role', async (_request, context, auth) => {
  try {
    const { id } = await context.params;

    if (id === auth.userId) {
      return NextResponse.json(
        { error: '자신의 계정은 비활성화할 수 없습니다', code: 'SELF_DEACTIVATE' },
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

    const user = await db.adminUser.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await db.adminSession.deleteMany({ where: { userId: id } });
    void revokeUserSessions;

    await logAudit({
      userId: auth.userId,
      action: 'deactivate',
      entity: 'AdminUser',
      entityId: id,
      before: { isActive: true },
      after: { isActive: false },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: '사용자 비활성화 중 오류가 발생했습니다' }, { status: 500 });
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { updateUserSchema } from '@/lib/admin/schemas';
import { hashPassword } from '@/lib/admin/password';
import { logAudit } from '@/lib/admin/audit';
import { hasPermission, type Role } from '@/lib/admin/rbac';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id] - Single user detail
export const GET = withAuth('users:read', async (_request, context, auth) => {
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
        failedAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
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

// PUT /api/admin/users/[id] - Update user
export const PUT = withAuth('users:write', async (request, context, auth) => {
  try {
    const { id } = await context.params;

    const existing = await db.adminUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
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

    // Role change requires superadmin (users:role permission)
    if (data.role !== undefined && !hasPermission(auth.role as Role, 'users:role')) {
      return NextResponse.json(
        { error: '역할 변경 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check email uniqueness
    if (data.email && data.email !== existing.email) {
      const emailExists = await db.adminUser.findUnique({ where: { email: data.email } });
      if (emailExists) {
        return NextResponse.json(
          { error: '이미 존재하는 이메일입니다', code: 'DUPLICATE_EMAIL' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password !== undefined) {
      updateData.passwordHash = await hashPassword(data.password);
    }

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

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'AdminUser',
      entityId: id,
      before: {
        name: existing.name,
        email: existing.email,
        role: existing.role,
        isActive: existing.isActive,
      },
      after: user,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: '사용자 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Soft delete: deactivate
    const user = await db.adminUser.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Delete all sessions for this user
    await db.adminSession.deleteMany({ where: { userId: id } });

    // Audit log
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
    return NextResponse.json(
      { error: '사용자 비활성화 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

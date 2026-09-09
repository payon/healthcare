import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { db } from '@/lib/db';

// GET /api/admin/audit-logs - Paginated audit logs with filters
export const GET = withAuth('audit:read', async (request, _context, _auth) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')));
    const userId = url.searchParams.get('userId') ?? undefined;
    const action = url.searchParams.get('action') ?? undefined;
    const entity = url.searchParams.get('entity') ?? undefined;
    const startDate = url.searchParams.get('startDate') ?? undefined;
    const endDate = url.searchParams.get('endDate') ?? undefined;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;

    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) createdAt.lte = new Date(endDate);
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          action: true,
          entity: true,
          entityId: true,
          changes: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Parse changes JSON
    const parsed = logs.map((log) => ({
      ...log,
      changes: JSON.parse(log.changes) as Record<string, unknown>,
    }));

    return NextResponse.json({
      logs: parsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: '감사 로그를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

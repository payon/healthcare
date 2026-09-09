import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { measurementSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';

// GET /api/admin/measurements - List all measurement items with equipment
export const GET = withAuth('measurements:read', async (request, _context, _auth) => {
  try {
    const url = new URL(request.url);
    const isActive = url.searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === 'true';

    const measurements = await db.measurementItem.findMany({
      where,
      include: {
        equipment: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    console.error('List measurements error:', error);
    return NextResponse.json(
      { error: '측정 항목 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// POST /api/admin/measurements - Create measurement item
export const POST = withAuth('measurements:write', async (request, _context, auth) => {
  try {
    const body = await request.json();
    const parsed = measurementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique key
    const existing = await db.measurementItem.findUnique({ where: { key: data.key } });
    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 키입니다', code: 'DUPLICATE_KEY' },
        { status: 409 }
      );
    }

    const measurement = await db.measurementItem.create({
      data,
      include: {
        equipment: true,
      },
    });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'create',
      entity: 'MeasurementItem',
      entityId: measurement.id,
      after: data,
    });

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    console.error('Create measurement error:', error);
    return NextResponse.json(
      { error: '측정 항목 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

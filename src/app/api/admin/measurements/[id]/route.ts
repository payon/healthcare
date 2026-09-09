import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { measurementSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/measurements/[id] - Single measurement detail
export const GET = withAuth('measurements:read', async (_request, context, _auth) => {
  try {
    const { id } = await context.params;

    const measurement = await db.measurementItem.findUnique({
      where: { id },
      include: {
        equipment: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: '측정 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ measurement });
  } catch (error) {
    console.error('Get measurement error:', error);
    return NextResponse.json(
      { error: '측정 항목을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/measurements/[id] - Update measurement
export const PUT = withAuth('measurements:write', async (request, context, auth) => {
  try {
    const { id } = await context.params;

    const existing = await db.measurementItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: '측정 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = measurementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique key if changed
    if (data.key !== existing.key) {
      const keyExists = await db.measurementItem.findUnique({ where: { key: data.key } });
      if (keyExists) {
        return NextResponse.json(
          { error: '이미 존재하는 키입니다', code: 'DUPLICATE_KEY' },
          { status: 409 }
        );
      }
    }

    const measurement = await db.measurementItem.update({
      where: { id },
      data,
      include: {
        equipment: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'MeasurementItem',
      entityId: id,
      before: {
        key: existing.key,
        name: existing.name,
        description: existing.description,
        color: existing.color,
        order: existing.order,
        isActive: existing.isActive,
      },
      after: data,
    });

    return NextResponse.json({ measurement });
  } catch (error) {
    console.error('Update measurement error:', error);
    return NextResponse.json(
      { error: '측정 항목 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/measurements/[id] - Delete measurement
export const DELETE = withAuth('measurements:write', async (_request, context, auth) => {
  try {
    const { id } = await context.params;

    const existing = await db.measurementItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: '측정 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await db.measurementItem.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'delete',
      entity: 'MeasurementItem',
      entityId: id,
      before: { key: existing.key, name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete measurement error:', error);
    return NextResponse.json(
      { error: '측정 항목 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

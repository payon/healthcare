import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { equipmentSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/measurements/[id]/equipment - List equipment for a measurement
export const GET = withAuth('measurements:read', async (_request, context, _auth) => {
  try {
    const { id } = await context.params;

    const measurement = await db.measurementItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: '측정 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const equipment = await db.measurementEquipment.findMany({
      where: { measurementId: id },
      orderBy: { order: 'asc' },
    });

    // Parse JSON fields
    const parsed = equipment.map((eq) => ({
      ...eq,
      preparationSteps: JSON.parse(eq.preparationSteps) as string[],
      precautions: JSON.parse(eq.precautions) as string[],
    }));

    return NextResponse.json({ equipment: parsed });
  } catch (error) {
    console.error('List equipment error:', error);
    return NextResponse.json(
      { error: '장비 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// POST /api/admin/measurements/[id]/equipment - Create equipment for a measurement
export const POST = withAuth('measurements:write', async (request, context, auth) => {
  try {
    const { id } = await context.params;

    const measurement = await db.measurementItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: '측정 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = equipmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const equipment = await db.measurementEquipment.create({
      data: {
        measurementId: id,
        name: data.name,
        description: data.description,
        preparationSteps: JSON.stringify(data.preparationSteps),
        precautions: JSON.stringify(data.precautions),
        imageUrl: data.imageUrl ?? null,
        order: data.order,
      },
    });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'create',
      entity: 'MeasurementEquipment',
      entityId: equipment.id,
      after: data,
    });

    return NextResponse.json({
      equipment: {
        ...equipment,
        preparationSteps: data.preparationSteps,
        precautions: data.precautions,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create equipment error:', error);
    return NextResponse.json(
      { error: '장비 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

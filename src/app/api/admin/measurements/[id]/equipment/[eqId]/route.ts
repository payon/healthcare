import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { equipmentSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';
import { precautionToObjects, stepList } from '@/lib/equipment-normalize';

type RouteContext = { params: Promise<{ id: string; eqId: string }> };

// PUT /api/admin/measurements/[id]/equipment/[eqId] - Update equipment
export const PUT = withAuth('measurements:write', async (request, context, auth) => {
  try {
    const { id, eqId } = await context.params;

    const existing = await db.measurementEquipment.findFirst({
      where: { id: eqId, measurementId: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '장비를 찾을 수 없습니다' },
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

    const equipment = await db.measurementEquipment.update({
      where: { id: eqId },
      data: {
        name: data.name,
        description: data.description,
        preparationSteps: JSON.stringify(stepList(data.preparationSteps)),
        precautions: JSON.stringify(precautionToObjects(data.precautions)),
        imageUrl: data.imageUrl ?? null,
        order: data.order,
      },
    });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'MeasurementEquipment',
      entityId: eqId,
      before: {
        name: existing.name,
        description: existing.description,
        preparationSteps: JSON.parse(existing.preparationSteps),
        precautions: JSON.parse(existing.precautions),
      },
      after: data,
    });

    return NextResponse.json({
      equipment: {
        ...equipment,
        preparationSteps: data.preparationSteps,
        precautions: data.precautions,
      },
    });
  } catch (error) {
    console.error('Update equipment error:', error);
    return NextResponse.json(
      { error: '장비 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/measurements/[id]/equipment/[eqId] - Delete equipment
export const DELETE = withAuth('measurements:write', async (_request, context, auth) => {
  try {
    const { id, eqId } = await context.params;

    const existing = await db.measurementEquipment.findFirst({
      where: { id: eqId, measurementId: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '장비를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await db.measurementEquipment.delete({ where: { id: eqId } });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'delete',
      entity: 'MeasurementEquipment',
      entityId: eqId,
      before: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete equipment error:', error);
    return NextResponse.json(
      { error: '장비 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

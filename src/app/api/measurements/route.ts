import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { precautionToObjects, stepList } from '@/lib/equipment-normalize';

export async function GET() {
  try {
    const measurements = await db.measurementItem.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: { equipment: { orderBy: { order: 'asc' } } },
    });

    // 키오스크 규격으로 정규화 (구 문자열 주의사항 → 객체, 어떤 모양이 와도 안전)
    const result = measurements.map((m) => ({
      ...m,
      equipment: m.equipment.map((eq) => ({
        ...eq,
        preparationSteps: stepList(eq.preparationSteps),
        precautions: precautionToObjects(eq.precautions),
      })),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

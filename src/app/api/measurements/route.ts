import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeParseJson } from '@/lib/admin/rate-limit';

export async function GET() {
  try {
    const measurements = await db.measurementItem.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: { equipment: { orderBy: { order: 'asc' } } },
    });

    const result = measurements.map((m) => ({
      ...m,
      equipment: m.equipment.map((eq) => ({
        ...eq,
        preparationSteps: safeParseJson<string[]>(eq.preparationSteps || '[]', []),
        precautions: safeParseJson<unknown[]>(eq.precautions || '[]', []),
      })),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

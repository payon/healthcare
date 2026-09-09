import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const measurements = await db.measurementItem.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        equipment: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Parse JSON fields in equipment
    const result = measurements.map((m) => ({
      ...m,
      equipment: m.equipment.map((eq) => ({
        ...eq,
        preparationSteps: JSON.parse(eq.preparationSteps || '[]'),
        precautions: JSON.parse(eq.precautions || '[]'),
      })),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

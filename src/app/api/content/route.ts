import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public read-only endpoint. Writes must go through /api/admin/content/* (authenticated).
export async function GET() {
  try {
    const contents = await db.kioskContent.findMany({
      orderBy: { section: 'asc' },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    return NextResponse.json(contents);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

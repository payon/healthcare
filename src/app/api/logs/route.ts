import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kioskLogSchema } from '@/lib/admin/schemas';
import { checkRateLimit, getClientIp } from '@/lib/admin/rate-limit';
import { withAuth } from '@/lib/admin/middleware';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`kiosk-log:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = kioskLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { sessionId, eventType, screen, detail } = parsed.data;

    await db.kioskLog.create({
      data: { sessionId, eventType, screen: screen || null, detail: detail || null },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Log reads require authentication (previously public disclosure of 100 rows)
export const GET = withAuth('audit:read', async (request) => {
  try {
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '100')));
    const logs = await db.kioskLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
});

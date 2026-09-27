import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VERSION = '1.0.0';

// GET /api/health - Liveness (no DB). ?deep=1 adds a DB ping for readiness.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const body: Record<string, unknown> = {
    status: 'ok',
    version: VERSION,
    uptimeSec: Math.round(process.uptime()),
    time: new Date().toISOString(),
  };

  if (url.searchParams.get('deep') === '1') {
    try {
      await db.$queryRaw`SELECT 1`;
      body.db = 'ok';
    } catch (error) {
      console.error('Health deep check failed:', error);
      return NextResponse.json({ ...body, status: 'degraded', db: 'error' }, { status: 503 });
    }
  }

  return NextResponse.json(body);
}

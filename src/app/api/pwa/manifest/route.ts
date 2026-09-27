import { NextResponse } from 'next/server';
import { ensurePwaIcons, buildManifest } from '@/lib/pwa-icons';

// GET /api/pwa/manifest - Dynamic Web App Manifest (admin-managed icons).
// Public: required for PWA installability on every device.
export async function GET() {
  try {
    const icons = await ensurePwaIcons();
    return NextResponse.json(buildManifest('Biogram MINI 헬스케어 장비 이용 교육', '바이오그램 교육', icons), {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Manifest error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

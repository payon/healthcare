import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/settings - Public operational settings (allowlisted keys only).
// Polled rarely by kiosks (TTS tuning). Never put secrets in AppSetting.
export async function GET() {
  try {
    const rows = await db.appSetting.findMany({
      where: { key: { in: ['tts.rate', 'tts.voiceURI'] } },
    });
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { logAudit } from '@/lib/admin/audit';

// Publicly exposed keys (non-sensitive operational tuning only)
const PUBLIC_KEYS = ['tts.rate', 'tts.voiceURI'] as const;

const upsertSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1).max(64),
        value: z.string().max(2000),
      })
    )
    .max(50),
});

// GET /api/admin/settings - All settings (settings:read)
export const GET = withAuth('settings:read', async () => {
  try {
    const rows = await db.appSetting.findMany({ orderBy: { key: 'asc' } });
    return NextResponse.json({ settings: rows });
  } catch (error) {
    console.error('List settings error:', error);
    return NextResponse.json(
      { error: '설정을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/settings - Upsert settings (settings:write)
export const PUT = withAuth('settings:write', async (request: NextRequest, _context, auth) => {
  try {
    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    for (const { key, value } of parsed.data.settings) {
      await db.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'AppSetting',
      after: { keys: parsed.data.settings.map((s) => s.key) },
    });

    const rows = await db.appSetting.findMany({ orderBy: { key: 'asc' } });
    return NextResponse.json({ settings: rows });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: '설정 저장 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

export function isPublicSettingKey(key: string): key is (typeof PUBLIC_KEYS)[number] {
  return (PUBLIC_KEYS as readonly string[]).includes(key);
}

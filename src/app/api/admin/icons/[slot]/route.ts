import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { ensurePwaIcons, PWA_ICON_SLOTS } from '@/lib/pwa-icons';
import { getUploadBaseDir } from '@/lib/admin/upload';
import { logAudit } from '@/lib/admin/audit';
import { checkRateLimit, getClientIp } from '@/lib/admin/rate-limit';
import { db } from '@/lib/db';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

type RouteContext = { params: Promise<Record<string, string>> };

const MAX_ICON_BYTES = 5 * 1024 * 1024;

// POST /api/admin/icons/[slot]/upload - Replace a PWA icon slot (images:upload)
export const POST = withAuth('images:upload', async (request: NextRequest, context: RouteContext, auth) => {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`icon:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요' },
      { status: 429 }
    );
  }

  try {
    const { slot } = (await context.params) as { slot: string };
    const def = PWA_ICON_SLOTS.find((s) => s.slot === slot);
    if (!def) {
      return NextResponse.json({ error: '알 수 없는 아이콘 슬롯입니다' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 });
    }
    if (file.size > MAX_ICON_BYTES) {
      return NextResponse.json({ error: '파일 크기가 5MB를 초과합니다' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let pipeline: sharp.Sharp;
    try {
      pipeline = sharp(buffer, { failOnError: true });
      await pipeline.metadata();
    } catch {
      return NextResponse.json({ error: '유효한 이미지 파일이 아닙니다' }, { status: 400 });
    }

    // Exact slot size. Maskable slots get 80% artwork on solid background
    // (safe zone) so Android adaptive masks never crop the logo.
    let canvas: sharp.Sharp;
    if (def.purpose === 'maskable') {
      const inner = Math.round(def.size * 0.8);
      const artwork = await sharp(buffer).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
      canvas = sharp({
        create: {
          width: def.size,
          height: def.size,
          channels: 4,
          background: { r: 13, g: 148, b: 136, alpha: 1 }, // theme teal
        },
      }).composite([{ input: artwork, gravity: 'center' }]);
    } else {
      canvas = sharp(buffer).resize(def.size, def.size, { fit: 'cover' });
    }
    const out = await canvas.png().toBuffer();

    const now = new Date();
    const dateDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filename = `pwa-${slot}-${Date.now()}-${randomUUID().slice(0, 8)}.png`;
    const dir = path.join(getUploadBaseDir(), 'pwa-icons', dateDir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), out);
    const url = `/admin-uploads/pwa-icons/${dateDir}/${filename}`;

    await db.uploadedImage.create({
      data: {
        url,
        filename,
        width: def.size,
        height: def.size,
        mimeType: 'image/png',
        size: out.length,
        category: 'pwa-icon',
        variants: '[]',
        uploadedBy: auth.userId,
      },
    });

    const icon = await db.pwaIcon.upsert({
      where: { slot },
      create: { slot, url, size: def.size, purpose: def.purpose, isDefault: false },
      update: { url, size: def.size, purpose: def.purpose, isDefault: false },
    });

    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'PwaIcon',
      entityId: icon.id,
      after: { slot, url, size: def.size },
    });

    return NextResponse.json({ icon }, { status: 201 });
  } catch (error) {
    console.error('Icon upload error:', error);
    return NextResponse.json(
      { error: '아이콘 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/icons/[slot] - Restore bundled default icon
export const DELETE = withAuth('images:upload', async (_request: NextRequest, context: RouteContext, auth) => {
  try {
    const { slot } = (await context.params) as { slot: string };
    const def = PWA_ICON_SLOTS.find((s) => s.slot === slot);
    if (!def) {
      return NextResponse.json({ error: '알 수 없는 아이콘 슬롯입니다' }, { status: 404 });
    }

    const icon = await db.pwaIcon.upsert({
      where: { slot },
      create: { slot, url: def.defaultUrl, size: def.size, purpose: def.purpose, isDefault: true },
      update: { url: def.defaultUrl, isDefault: true },
    });

    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'PwaIcon',
      entityId: icon.id,
      after: { slot, restoredDefault: true },
    });

    return NextResponse.json({ icon });
  } catch (error) {
    console.error('Icon restore error:', error);
    return NextResponse.json(
      { error: '아이콘 복원 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

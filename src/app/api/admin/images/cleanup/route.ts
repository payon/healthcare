import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/admin/audit';
import { getUploadBaseDir, getLegacyUploadBaseDir } from '@/lib/admin/upload';
import { safeParseJson } from '@/lib/admin/rate-limit';
import path from 'path';
import fs from 'fs/promises';

// POST /api/admin/images/cleanup - Delete ALL unreferenced images (images:upload).
// Frees disk occupied by orphaned uploads. Referenced images are never touched.
export const POST = withAuth('images:upload', async (_request, _context, auth) => {
  try {
    const [contents, sections, measurements, equipments, icons, images] = await Promise.all([
      db.kioskContent.findMany({
        select: { imageUrl: true, qrCodeUrl: true, backgroundImageUrl: true, mapImageUrl: true },
      }),
      db.contentSection.findMany({ select: { imageUrl: true } }),
      db.measurementItem.findMany({ select: { imageUrl: true } }),
      db.measurementEquipment.findMany({ select: { imageUrl: true } }),
      db.pwaIcon.findMany({ select: { url: true, isDefault: true } }),
      db.uploadedImage.findMany(),
    ]);

    const referenced = new Set<string>();
    for (const c of contents) {
      for (const u of [c.imageUrl, c.qrCodeUrl, c.backgroundImageUrl, c.mapImageUrl]) {
        if (u) referenced.add(u);
      }
    }
    for (const s of sections) if (s.imageUrl) referenced.add(s.imageUrl);
    for (const m of measurements) if (m.imageUrl) referenced.add(m.imageUrl);
    for (const e of equipments) if (e.imageUrl) referenced.add(e.imageUrl);
    for (const i of icons) if (!i.isDefault && i.url) referenced.add(i.url);

    let deleted = 0;
    let freedBytes = 0;
    for (const img of images) {
      const variants = safeParseJson<Array<{ url: string }>>(img.variants, []);
      const urls = [img.url, ...variants.map((v) => v.url)];
      if (urls.some((u) => referenced.has(u))) continue;

      const names = new Set(urls.map((u) => path.basename(u)));
      const urlDir = path.posix.dirname(img.url).replace(/^\/admin-uploads\/?/, '');
      for (const base of [getUploadBaseDir(), getLegacyUploadBaseDir()]) {
        for (const name of names) {
          try {
            const fp = path.join(base, urlDir, name);
            const stat = await fs.stat(fp);
            freedBytes += stat.size;
            await fs.unlink(fp);
          } catch {
            // already gone — ignore
          }
        }
      }
      await db.uploadedImage.delete({ where: { id: img.id } });
      deleted += 1;
    }

    await logAudit({
      userId: auth.userId,
      action: 'cleanup',
      entity: 'UploadedImage',
      after: { deleted, freedBytes },
    });

    return NextResponse.json({ success: true, deleted, freedBytes });
  } catch (error) {
    console.error('Cleanup images error:', error);
    return NextResponse.json(
      { error: '정리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

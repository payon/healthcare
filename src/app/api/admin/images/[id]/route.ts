import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/admin/audit';
import { getUploadBaseDir, getLegacyUploadBaseDir } from '@/lib/admin/upload';
import { safeParseJson } from '@/lib/admin/rate-limit';
import path from 'path';
import fs from 'fs/promises';

type RouteContext = { params: Promise<Record<string, string>> };

// DELETE /api/admin/images/[id] - Delete image record + all variant files (images:upload)
export const DELETE = withAuth('images:upload', async (_request: NextRequest, context: RouteContext, auth) => {
  try {
    const { id } = (await context.params) as { id: string };

    const image = await db.uploadedImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: '이미지를 찾을 수 없습니다' }, { status: 404 });
    }

    // Safety: refuse when referenced by live kiosk content (avoid blank images).
    const urls = [
      image.url,
      ...safeParseJson<Array<{ url: string }>>(image.variants, []).map((v) => v.url),
    ];
    const usages: string[] = [];
    const contents = await db.kioskContent.findMany({
      where: {
        OR: [
          { imageUrl: { in: urls } },
          { qrCodeUrl: { in: urls } },
          { backgroundImageUrl: { in: urls } },
          { mapImageUrl: { in: urls } },
        ],
      },
      select: { section: true, title: true },
    });
    for (const c of contents) usages.push(`화면:${c.section}`);
    const sectionHit = await db.contentSection.findFirst({
      where: { imageUrl: { in: urls } },
      select: { sectionKey: true, content: { select: { section: true } } },
    });
    if (sectionHit) usages.push(`섹션:${sectionHit.content.section}/${sectionHit.sectionKey}`);
    const measHit = await db.measurementItem.findFirst({
      where: { imageUrl: { in: urls } },
      select: { key: true },
    });
    if (measHit) usages.push(`측정항목:${measHit.key}`);
    const eqHit = await db.measurementEquipment.findFirst({
      where: { imageUrl: { in: urls } },
      select: { name: true },
    });
    if (eqHit) usages.push(`장비:${eqHit.name}`);
    const iconHit = await db.pwaIcon.findFirst({
      where: { url: { in: urls }, isDefault: false },
      select: { slot: true },
    });
    if (iconHit) usages.push(`PWA아이콘:${iconHit.slot}`);

    if (usages.length > 0) {
      return NextResponse.json(
        { error: `사용 중인 이미지라 삭제할 수 없습니다 (${usages.join(', ')})`, code: 'IN_USE', usages },
        { status: 409 }
      );
    }

    // Delete variant files from disk (canonical + legacy locations)
    const filenames = new Set<string>();
    filenames.add(path.basename(image.url));
    for (const v of safeParseJson<Array<{ url: string }>>(image.variants, [])) {
      filenames.add(path.basename(v.url));
    }
    // Group by directory portion of the URL to preserve date/category structure
    const urlDir = path.posix.dirname(image.url).replace(/^\/admin-uploads\/?/, '');
    let freedBytes = 0;
    for (const base of [getUploadBaseDir(), getLegacyUploadBaseDir()]) {
      for (const name of filenames) {
        const filePath = path.join(base, urlDir, name);
        try {
          const stat = await fs.stat(filePath);
          freedBytes += stat.size;
          await fs.unlink(filePath);
        } catch {
          // already gone / other base — ignore
        }
      }
    }

    await db.uploadedImage.delete({ where: { id } });

    await logAudit({
      userId: auth.userId,
      action: 'delete',
      entity: 'UploadedImage',
      entityId: id,
      before: { url: image.url, size: image.size },
      after: { freedBytes },
    });

    return NextResponse.json({ success: true, freedBytes });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: '이미지 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

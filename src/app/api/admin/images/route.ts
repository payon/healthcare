import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { db } from '@/lib/db';
import { safeParseJson } from '@/lib/admin/rate-limit';

// GET /api/admin/images - Uploaded image library (DB-backed, newest first)
export const GET = withAuth('images:upload', async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get('limit') ?? '24')));
    const category = url.searchParams.get('category') ?? undefined;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const [images, total, stats] = await Promise.all([
      db.uploadedImage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.uploadedImage.count({ where }),
      db.uploadedImage.aggregate({ _sum: { size: true }, _count: { id: true } }),
    ]);

    // Reference map (single batched pass): which live content uses each URL.
    const [contents, sections, measurements, equipments, icons] = await Promise.all([
      db.kioskContent.findMany({
        select: { section: true, imageUrl: true, qrCodeUrl: true, backgroundImageUrl: true, mapImageUrl: true },
      }),
      db.contentSection.findMany({
        select: { imageUrl: true, sectionKey: true, content: { select: { section: true } } },
      }),
      db.measurementItem.findMany({ select: { key: true, imageUrl: true } }),
      db.measurementEquipment.findMany({ select: { name: true, imageUrl: true } }),
      db.pwaIcon.findMany({ select: { slot: true, url: true, isDefault: true } }),
    ]);
    const refMap = new Map<string, string[]>();
    const mark = (refUrl: string | null, label: string) => {
      if (!refUrl) return;
      const list = refMap.get(refUrl) ?? [];
      list.push(label);
      refMap.set(refUrl, list);
    };
    for (const c of contents) {
      mark(c.imageUrl, `화면:${c.section}`);
      mark(c.qrCodeUrl, `화면:${c.section}/QR`);
      mark(c.backgroundImageUrl, `화면:${c.section}/배경`);
      mark(c.mapImageUrl, `화면:${c.section}/지도`);
    }
    for (const s of sections) mark(s.imageUrl, `섹션:${s.content.section}/${s.sectionKey}`);
    for (const m of measurements) mark(m.imageUrl, `측정항목:${m.key}`);
    for (const e of equipments) mark(e.imageUrl, `장비:${e.name}`);
    for (const i of icons) if (!i.isDefault) mark(i.url, `PWA아이콘:${i.slot}`);

    return NextResponse.json({
      images: images.map((img) => {
        const variants = safeParseJson<Array<{ url: string; width: number }>>(img.variants, []);
        const usedIn = new Set<string>();
        for (const u of [img.url, ...variants.map((v) => v.url)]) {
          (refMap.get(u) ?? []).forEach((l) => usedIn.add(l));
        }
        return { ...img, variants, usedIn: [...usedIn] };
      }),
      storage: {
        totalCount: stats._count.id,
        totalBytes: stats._sum.size ?? 0,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List images error:', error);
    return NextResponse.json(
      { error: '이미지 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

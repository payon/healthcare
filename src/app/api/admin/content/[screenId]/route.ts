import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { contentUpdateSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';

type RouteContext = { params: Promise<{ screenId: string }> };

// GET /api/admin/content/[screenId] - Single screen content with sections
export const GET = withAuth('content:read', async (_request, context, _auth) => {
  try {
    const { screenId } = await context.params;

    const content = await db.kioskContent.findUnique({
      where: { section: screenId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { error: '콘텐츠를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/content/[screenId] - Update content
export const PUT = withAuth('content:write', async (request, context, auth) => {
  try {
    const { screenId } = await context.params;

    const existing = await db.kioskContent.findUnique({
      where: { section: screenId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = contentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const content = await db.kioskContent.update({
      where: { section: screenId },
      data,
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'KioskContent',
      entityId: existing.id,
      before: {
        title: existing.title,
        body: existing.body,
        imageUrl: existing.imageUrl,
        qrCodeUrl: existing.qrCodeUrl,
      },
      after: {
        title: content.title,
        body: content.body,
        imageUrl: content.imageUrl,
        qrCodeUrl: content.qrCodeUrl,
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Update content error:', error);
    return NextResponse.json(
      { error: '콘텐츠 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

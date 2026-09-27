import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { createSectionSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';

type RouteContext = { params: Promise<{ screenId: string }> };

// POST /api/admin/content/[screenId]/sections - Create a section within a screen
export const POST = withAuth('content:write', async (request, context, auth) => {
  try {
    const { screenId } = await context.params;

    const content = await db.kioskContent.findUnique({ where: { section: screenId } });
    if (!content) {
      return NextResponse.json(
        { error: '화면 콘텐츠를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = createSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await db.contentSection.findUnique({
      where: { contentId_sectionKey: { contentId: content.id, sectionKey: parsed.data.sectionKey } },
    });
    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 섹션 키입니다', code: 'DUPLICATE_KEY' },
        { status: 409 }
      );
    }

    const section = await db.contentSection.create({
      data: {
        contentId: content.id,
        sectionKey: parsed.data.sectionKey,
        title: parsed.data.title,
        body: parsed.data.body,
        imageUrl: parsed.data.imageUrl ?? null,
        order: parsed.data.order,
      },
    });

    await logAudit({
      userId: auth.userId,
      action: 'create',
      entity: 'ContentSection',
      entityId: section.id,
      after: { screenId, sectionKey: section.sectionKey, title: section.title, order: section.order },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Create section error:', error);
    return NextResponse.json(
      { error: '섹션 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

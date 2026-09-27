import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { sectionUpdateSchema } from '@/lib/admin/schemas';
import { logAudit } from '@/lib/admin/audit';

type RouteContext = { params: Promise<{ screenId: string; key: string }> };

// PUT /api/admin/content/[screenId]/sections/[key] - Update a section within a screen
export const PUT = withAuth('content:write', async (request, context, auth) => {
  try {
    const { screenId, key } = await context.params;

    // Find the parent content
    const content = await db.kioskContent.findUnique({
      where: { section: screenId },
    });

    if (!content) {
      return NextResponse.json(
        { error: '화면 콘텐츠를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Find the section
    const existing = await db.contentSection.findUnique({
      where: {
        contentId_sectionKey: {
          contentId: content.id,
          sectionKey: key,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '섹션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = sectionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const section = await db.contentSection.update({
      where: { id: existing.id },
      data,
    });

    // Audit log
    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'ContentSection',
      entityId: existing.id,
      before: {
        title: existing.title,
        body: existing.body,
        imageUrl: existing.imageUrl,
        order: existing.order,
      },
      after: {
        title: section.title,
        body: section.body,
        imageUrl: section.imageUrl,
        order: section.order,
      },
    });

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json(
      { error: '섹션 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/content/[screenId]/sections/[key] - Delete a section
export const DELETE = withAuth('content:write', async (_request, context, auth) => {
  try {
    const { screenId, key } = await context.params;

    const content = await db.kioskContent.findUnique({ where: { section: screenId } });
    if (!content) {
      return NextResponse.json(
        { error: '화면 콘텐츠를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const existing = await db.contentSection.findUnique({
      where: { contentId_sectionKey: { contentId: content.id, sectionKey: key } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: '섹션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await db.contentSection.delete({ where: { id: existing.id } });

    await logAudit({
      userId: auth.userId,
      action: 'delete',
      entity: 'ContentSection',
      entityId: existing.id,
      before: { screenId, sectionKey: key, title: existing.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json(
      { error: '섹션 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

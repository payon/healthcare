import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';

// GET /api/admin/content - List all KioskContent with ContentSections
export const GET = withAuth('content:read', async (_request, _context, _auth) => {
  try {
    const contents = await db.kioskContent.findMany({
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { section: 'asc' },
    });

    return NextResponse.json({ contents });
  } catch (error) {
    console.error('List content error:', error);
    return NextResponse.json(
      { error: '콘텐츠 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

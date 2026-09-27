import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { ensurePwaIcons } from '@/lib/pwa-icons';

// GET /api/admin/icons - PWA icon slots with current URLs (images:upload)
export const GET = withAuth('images:upload', async () => {
  try {
    const icons = await ensurePwaIcons();
    return NextResponse.json({ icons });
  } catch (error) {
    console.error('List icons error:', error);
    return NextResponse.json(
      { error: '아이콘 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

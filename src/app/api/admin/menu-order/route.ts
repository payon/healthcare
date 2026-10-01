import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/admin/middleware';
import { logAudit } from '@/lib/admin/audit';
import { MENU_ORDER_KEY, DEFAULT_MENU_ORDER, parseMenuOrder } from '@/lib/menu-order';
import type { Screen } from '@/store/kiosk-store';

const orderSchema = z.object({
  order: z.array(z.string().min(1).max(64)).min(1).max(30),
});

// GET /api/admin/menu-order - 현재 메뉴 순서 (content:read)
export const GET = withAuth('content:read', async () => {
  try {
    const row = await db.appSetting.findUnique({ where: { key: MENU_ORDER_KEY } });
    let order = DEFAULT_MENU_ORDER;
    if (row) {
      try {
        order = parseMenuOrder(JSON.parse(row.value));
      } catch {
        order = DEFAULT_MENU_ORDER;
      }
    }
    return NextResponse.json({ order, isDefault: !row });
  } catch (error) {
    console.error('Get menu order error:', error);
    return NextResponse.json(
      { error: '메뉴 순서를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/menu-order - 메뉴 순서 저장 (content:write).
// 부분 순서도 허용 (빠진 화면은 뒤에 자동 추가). 저장 즉시 키오스크에 반영됨.
export const PUT = withAuth('content:write', async (request: NextRequest, _context, auth) => {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const order: Screen[] = parseMenuOrder(parsed.data.order);
    await db.appSetting.upsert({
      where: { key: MENU_ORDER_KEY },
      create: { key: MENU_ORDER_KEY, value: JSON.stringify(order) },
      update: { value: JSON.stringify(order) },
    });

    await logAudit({
      userId: auth.userId,
      action: 'update',
      entity: 'AppSetting',
      after: { key: MENU_ORDER_KEY, order },
    });

    return NextResponse.json({ order, isDefault: false });
  } catch (error) {
    console.error('Update menu order error:', error);
    return NextResponse.json(
      { error: '메뉴 순서 저장 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});

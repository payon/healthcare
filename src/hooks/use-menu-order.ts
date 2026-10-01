'use client';

import { useQuery } from '@tanstack/react-query';
import type { Screen } from '@/store/kiosk-store';
import { MENU_ORDER_KEY, DEFAULT_MENU_ORDER, parseMenuOrder } from '@/lib/menu-order';

/**
 * 관리자 지정 메인 메뉴 순서. /api/settings 폴링으로 수 초 내 반영.
 * 저장된 값이 없거나 깨지면 기본 순서로 폴백 (신규 화면 누락 방지).
 */
export function useMenuOrder(): Screen[] {
  const { data } = useQuery({
    queryKey: ['kiosk', 'menu-order'],
    queryFn: async (): Promise<Screen[]> => {
      const res = await fetch('/api/settings');
      if (!res.ok) return DEFAULT_MENU_ORDER;
      const json = (await res.json()) as { settings?: Record<string, string> };
      const raw = json.settings?.[MENU_ORDER_KEY];
      if (!raw) return DEFAULT_MENU_ORDER;
      try {
        return parseMenuOrder(JSON.parse(raw));
      } catch {
        return DEFAULT_MENU_ORDER;
      }
    },
    initialData: DEFAULT_MENU_ORDER,
    // initialData와 함께 staleTime을 주면 마운트 직후 fetch가 안 일어나
    // 기본 순서가 최대 5초간 표시되는 문제 → 즉시 갱신되게 0으로 둔다
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    retry: 1,
    notifyOnChangeProps: ['data', 'error', 'isPending'],
  });
  return data ?? DEFAULT_MENU_ORDER;
}

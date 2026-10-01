/**
 * 키오스크 메인 메뉴 순서 관리.
 * 관리자 화면(/admin/menu-order)에서 순서를 바꾸면 AppSetting(menu.order)에
 * 저장되고, 키오스크는 /api/settings 폴링으로 수 초 내 반영한다.
 * 'completion'(실제 장비로 이동 CTA)은 항상 맨 마지막에 고정된다.
 */

import type { Screen } from '@/store/kiosk-store';

export const MENU_ORDER_KEY = 'menu.order';

/** 순서 관리 대상 화면 (메인 메뉴 가이드 10종) */
export const MENU_SCREENS: Screen[] = [
  'equipment-intro',
  'location',
  'app-install',
  'signup',
  'vein-register',
  'login',
  'non-member',
  'measurement-mode',
  'measurement-equipment',
  'results',
];

/** 기본 순서 = 기존 하드코딩 순서와 동일 */
export const DEFAULT_MENU_ORDER: Screen[] = [...MENU_SCREENS];

export const MENU_SCREEN_LABELS: Record<Screen, string> = {
  main: '메인 메뉴',
  'equipment-intro': '장비 소개',
  location: '설치 위치 안내',
  'app-install': '앱 설치 안내',
  signup: '회원가입 안내',
  'vein-register': '지정맥 등록 안내',
  login: '로그인 안내',
  'non-member': '비회원 안내',
  'measurement-mode': '측정 시작 안내',
  'measurement-equipment': '측정 장비 안내',
  results: '결과 확인 안내',
  completion: '실제 장비로 이동',
  more: '더보기',
};

const MENU_SET = new Set<string>(MENU_SCREENS);

/**
 * 저장된 값을 검증·정규화한다.
 * - 모르는 키 제거, 중복 제거
 * - 빠진 화면은 뒤에 자동 추가 (신규 화면이 사라지는 일 방지)
 */
export function parseMenuOrder(value: unknown): Screen[] {
  const seen = new Set<string>();
  const ordered: Screen[] = [];
  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === 'string' && MENU_SET.has(v) && !seen.has(v)) {
        seen.add(v);
        ordered.push(v as Screen);
      }
    }
  }
  for (const s of MENU_SCREENS) {
    if (!seen.has(s)) ordered.push(s);
  }
  return ordered;
}

/** 주어진 아이템 배열을 메뉴 순서대로 정렬 (순서 외 항목은 뒤로) */
export function sortByMenuOrder<T extends { screen: Screen }>(items: T[], order: Screen[]): T[] {
  const rank = new Map(order.map((s, i) => [s, i]));
  return [...items].sort(
    (a, b) => (rank.get(a.screen) ?? 999) - (rank.get(b.screen) ?? 999)
  );
}

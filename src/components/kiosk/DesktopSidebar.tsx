'use client';

import { useKioskStore } from '@/store/kiosk-store';
import { useMenuOrder } from '@/hooks/use-menu-order';
import { DESKTOP_MENU_ITEMS } from '@/lib/kiosk-menu';
import { sortByMenuOrder } from '@/lib/menu-order';
import { cn } from '@/lib/utils';
import { Home } from 'lucide-react';

/**
 * 데스크톱 전용 좌측 사이드바 (관리자 지정 순서).
 * 뒤로가기 없이 모든 메뉴에 바로 이동. 모바일에서는 숨김.
 */
export function DesktopSidebar() {
  const { currentScreen, navigateTo, goHome } = useKioskStore();
  const menuOrder = useMenuOrder();
  const guides = sortByMenuOrder(
    DESKTOP_MENU_ITEMS.filter((i) => i.screen !== 'completion'),
    menuOrder
  );
  const completion = DESKTOP_MENU_ITEMS.find((i) => i.screen === 'completion')!;
  const CompletionIcon = completion.icon;

  const itemClass = (active: boolean) =>
    cn(
      'flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left text-base font-medium transition-colors active:scale-[0.98]',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    );

  return (
    <aside
      aria-label="키오스크 메뉴"
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-1 overflow-y-auto border-r bg-card p-4 kiosk-scroll md:flex"
    >
      <p className="mb-2 px-2 text-lg font-extrabold">Biogram MINI</p>
      <button onClick={goHome} aria-label="홈으로 가기" className={itemClass(currentScreen === 'main')}>
        <Home className="h-5 w-5 shrink-0" />
        <span>홈</span>
      </button>
      <div className="my-2 h-px bg-border" />
      <nav aria-label="교육 메뉴" className="flex flex-col gap-1">
        {guides.map((item) => {
          const Icon = item.icon;
          const active = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => navigateTo(item.screen)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={itemClass(active)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="my-2 h-px bg-border" />
      <button
        onClick={() => navigateTo(completion.screen)}
        aria-label={completion.label}
        aria-current={currentScreen === 'completion' ? 'page' : undefined}
        className={itemClass(currentScreen === 'completion')}
      >
        <CompletionIcon className="h-5 w-5 shrink-0" />
        <span className="leading-tight">{completion.label}</span>
      </button>
      <div className="mt-auto px-2 pt-4 text-xs leading-relaxed text-muted-foreground">
        실제 측정은 현장 장비에서 진행됩니다
      </div>
    </aside>
  );
}

/** 사이드바가 보이려면 콘텐츠 래퍼에 이 오프셋이 필요 */
export const SIDEBAR_OFFSET_CLASS = 'md:pl-60';

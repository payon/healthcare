'use client';

import { useKioskStore } from '@/store/kiosk-store';
import { useBottomTabs } from './screens/MoreScreen';

/**
 * 모바일 하단 네비게이션: 홈 + 관리자 순서 상위 4개 + 더보기.
 * 순서가 바뀌면 탭 구성도 함께 바뀐다.
 */
export function MobileBottomNav() {
  const { currentScreen, navigateTo, goHome } = useKioskStore();
  const tabs = useBottomTabs();

  return (
    <nav
      role="tablist"
      aria-label="모바일 하단 네비게이션"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card md:hidden"
    >
      <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = tab.matches.includes(currentScreen);
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => (tab.key === 'home' ? goHome() : navigateTo(tab.screen))}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="h-1 w-1 rounded-full bg-primary" />
              )}
              {!isActive && <span className="h-1 w-1" />}
              <span className="text-[10px] leading-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

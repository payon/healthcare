'use client';

import { Home, Activity, BookOpen, Stethoscope, Menu } from 'lucide-react';
import { useKioskStore, type Screen } from '@/store/kiosk-store';

interface TabDef {
  key: string;
  label: string;
  icon: React.ElementType;
  screen: Screen;
  /** Screens that should highlight this tab */
  matches: Screen[];
}

const tabs: TabDef[] = [
  {
    key: 'home',
    label: '홈',
    icon: Home,
    screen: 'main',
    matches: ['main', 'standby'],
  },
  {
    key: 'equipment',
    label: '장비',
    icon: Activity,
    screen: 'equipment-intro',
    matches: ['equipment-intro'],
  },
  {
    key: 'guide',
    label: '안내',
    icon: BookOpen,
    screen: 'signup',
    matches: ['signup', 'vein-register', 'login'],
  },
  {
    key: 'measure',
    label: '측정',
    icon: Stethoscope,
    screen: 'measurement-mode',
    matches: ['measurement-mode', 'measurement-equipment', 'results'],
  },
  {
    key: 'more',
    label: '더보기',
    icon: Menu,
    screen: 'main',
    matches: ['location', 'app-install', 'non-member', 'completion'],
  },
];

export function MobileBottomNav() {
  const { currentScreen, navigateTo } = useKioskStore();

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
              onClick={() => navigateTo(tab.screen)}
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

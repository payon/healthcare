'use client';

import { motion } from 'framer-motion';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { useKioskStore } from '@/store/kiosk-store';
import { useMenuOrder } from '@/hooks/use-menu-order';
import { MOBILE_CARDS, SCREEN_ICONS, SCREEN_SHORT_LABELS } from '@/lib/kiosk-menu';
import { sortByMenuOrder } from '@/lib/menu-order';
import type { Screen } from '@/store/kiosk-store';

/** 하단 탭에 들어가는 상위 개수 (관리자 순서 기준) */
export const BOTTOM_TAB_COUNT = 4;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * 더보기 화면: 관리자 순서에서 하단 탭(상위 N개)에 들지 못한 나머지 메뉴.
 * 순서를 바꾸면 이 목록과 하단 탭이 함께 바뀐다.
 */
export function MoreScreen() {
  const { navigateTo } = useKioskStore();
  const menuOrder = useMenuOrder();
  const rest = sortByMenuOrder(MOBILE_CARDS, menuOrder).slice(BOTTOM_TAB_COUNT);

  return (
    <ContentLayout title="더보기">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
        className="grid grid-cols-2 gap-3"
      >
        {rest.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.screen}
              variants={itemVariants}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigateTo(card.screen)}
              className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border bg-card p-3 text-center"
              aria-label={card.label}
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-base font-semibold leading-tight">{card.label}</span>
              <span className="text-xs leading-tight text-muted-foreground">{card.description}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </ContentLayout>
  );
}

/** 하단 탭 정의: 홈 + 상위 N개 + 더보기 */
export function useBottomTabs(): Array<{ key: string; label: string; icon: React.ElementType; screen: Screen; matches: Screen[] }> {
  const menuOrder = useMenuOrder();
  const top = sortByMenuOrder(MOBILE_CARDS, menuOrder).slice(0, BOTTOM_TAB_COUNT);
  return [
    { key: 'home', label: '홈', icon: SCREEN_ICONS.main, screen: 'main', matches: ['main'] },
    ...top.map((c) => ({
      key: c.screen,
      label: SCREEN_SHORT_LABELS[c.screen],
      icon: c.icon,
      screen: c.screen,
      matches: [c.screen],
    })),
    { key: 'more', label: '더보기', icon: SCREEN_ICONS.more, screen: 'more', matches: ['more'] },
  ];
}

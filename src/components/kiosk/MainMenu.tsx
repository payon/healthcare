'use client';

import { motion } from 'framer-motion';
import { ArrowRightCircle } from 'lucide-react';
import { useKioskStore, useProgress } from '@/store/kiosk-store';
import { DESKTOP_MENU_ITEMS, MOBILE_CARDS, type KioskMenuItem } from '@/lib/kiosk-menu';
import { useKioskContent } from '@/hooks/use-kiosk-content';
import { themeStyle } from '@/lib/kiosk-theme';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { MobileBottomNav } from './MobileBottomNav';
import { DesktopSidebar, SIDEBAR_OFFSET_CLASS } from './DesktopSidebar';
import { useTTS } from '@/hooks/use-tts';
import { useMenuOrder } from '@/hooks/use-menu-order';
import { sortByMenuOrder } from '@/lib/menu-order';

const menuItems: KioskMenuItem[] = DESKTOP_MENU_ITEMS;
const mobileCards: KioskMenuItem[] = MOBILE_CARDS;

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ------------------------------------------------------------------ */
/*  Shared: progress bar                                               */
/* ------------------------------------------------------------------ */
function ProgressBar() {
  const { visitedCount, total, percent } = useProgress();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-4 rounded-xl border bg-card p-3"
    >
      <div className="mb-1.5 flex items-center justify-between text-sm font-medium">
        <span>학습 진행률</span>
        <span className="tabular-nums">
          {visitedCount}/{total} ({percent}%)
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared: notice box                                                 */
/* ------------------------------------------------------------------ */
function NoticeBox() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="notice-box mt-6"
    >
      <p className="text-sm leading-relaxed">
        <span className="mr-1 font-semibold">안내:</span>
        본 교육 키오스크는 안내 목적이며, 실제 측정은 현장 Biogram MINI 장비에서 진행됩니다.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MainMenu component                                                 */
/* ------------------------------------------------------------------ */
export function MainMenu() {
  const { navigateTo } = useKioskStore();
  const { speakIntro, speakFull } = useTTS();
  const { getContent } = useKioskContent();
  const content = getContent('main');
  const heading = content?.title || '무엇을 도와드릴까요?';
  // 관리자 지정 순서 (completion CTA는 항상 맨 마지막 고정)
  const menuOrder = useMenuOrder();
  const orderedItems = sortByMenuOrder(
    menuItems.filter((i) => i.screen !== 'completion'),
    menuOrder
  );
  const completionItem = menuItems.find((i) => i.screen === 'completion')!;
  const orderedCards = sortByMenuOrder(mobileCards, menuOrder);

  return (
    <div
      className={`flex min-h-screen flex-col bg-background ${SIDEBAR_OFFSET_CLASS}`}
      style={themeStyle(content?.backgroundColor, content?.backgroundImageUrl)}
    >
      <DesktopSidebar />
      {/* Mobile-only header (desktop uses the sidebar instead) */}
      <KioskHeader />

      {/* Desktop floating accessibility toolbar */}
      <div className="hidden md:block">
        <AccessibilityToolbar onReplay={speakIntro} onReplayFull={speakFull} />
      </div>

      <main className="flex-1 overflow-y-auto kiosk-scroll px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Mobile: accessibility + progress at top */}
          <div className="mb-3 flex items-center justify-between md:hidden">
            <span className="text-lg font-bold">{heading}</span>
            <AccessibilityToolbar onReplay={speakIntro} onReplayFull={speakFull} />
          </div>

          {/* Mobile: progress bar */}
          <div className="md:hidden">
            <ProgressBar />
          </div>

          {/* Desktop: title + progress */}
          <div className="hidden md:block">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 text-2xl font-bold md:text-3xl"
            >
              {heading}
            </motion.h2>
            <ProgressBar />
          </div>

          {/* Desktop: 3-column grid (hidden on mobile) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-4 hidden grid-cols-3 gap-4 md:grid"
          >
            {orderedItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.screen}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigateTo(item.screen)}
                  className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-colors md:p-6 bg-card hover:border-primary/40 hover:shadow-md"
                >
                  <Icon className="h-8 w-8 shrink-0 text-primary" />
                  <span className="text-lg font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </motion.button>
              );
            })}
            {/* CTA는 항상 맨 마지막 고정 */}
            <motion.button
              key={completionItem.screen}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigateTo(completionItem.screen)}
              className="col-span-3 flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-primary bg-primary p-4 text-center transition-colors md:p-6 text-primary-foreground hover:bg-primary/90"
            >
              <ArrowRightCircle className="h-8 w-8 shrink-0 text-primary-foreground" />
              <span className="text-lg font-semibold text-primary-foreground">
                {completionItem.label}
              </span>
              <span className="text-sm text-primary-foreground/80">
                {completionItem.description}
              </span>
            </motion.button>
          </motion.div>

          {/* Mobile: horizontally scrollable cards */}
          <div className="mt-4 md:hidden">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 kiosk-scroll">
              {orderedCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.screen}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigateTo(card.screen)}
                    className="flex min-w-[140px] snap-start flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center transition-colors hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold leading-tight">
                      {card.label}
                    </span>
                    <span className="text-[11px] leading-tight text-muted-foreground">
                      {card.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Notice box (both mobile & desktop) */}
          <NoticeBox />

          {/* Mobile: bottom spacer for fixed CTA + bottom nav */}
          <div className="h-28 md:hidden" />
        </div>
      </main>

      {/* Desktop footer */}
      <div className="hidden md:block">
        <KioskFooter />
      </div>

      {/* Mobile: fixed CTA button above bottom nav */}
      <div className="fixed inset-x-0 bottom-[60px] z-40 px-4 pb-1 md:hidden">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigateTo('completion')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-colors hover:opacity-90"
        >
          <ArrowRightCircle className="h-5 w-5" />
          실제 장비로 이동
        </motion.button>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}

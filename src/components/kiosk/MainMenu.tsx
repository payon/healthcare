'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  MapPin,
  Smartphone,
  UserPlus,
  Fingerprint,
  LogIn,
  User,
  ClipboardCheck,
  Stethoscope,
  FileBarChart,
  ArrowRightCircle,
} from 'lucide-react';
import { useKioskStore, useProgress, type Screen } from '@/store/kiosk-store';
import { useKioskContent } from '@/hooks/use-kiosk-content';
import { themeStyle } from '@/lib/kiosk-theme';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { MobileBottomNav } from './MobileBottomNav';
import { useTTS } from '@/hooks/use-tts';

/* ------------------------------------------------------------------ */
/*  Desktop menu items (11 items, 3-column grid)                       */
/* ------------------------------------------------------------------ */
interface MenuItem {
  screen: Screen;
  label: string;
  description: string;
  icon: React.ElementType;
  cta?: boolean;
}

const menuItems: MenuItem[] = [
  {
    screen: 'equipment-intro',
    label: '장비 소개',
    description: 'Biogram MINI 측정 항목을 소개합니다',
    icon: Activity,
  },
  {
    screen: 'location',
    label: '설치 위치 안내',
    description: '장비가 설치된 위치를 안내합니다',
    icon: MapPin,
  },
  {
    screen: 'app-install',
    label: '앱 설치 안내',
    description: '바이오그램 앱 설치 방법을 안내합니다',
    icon: Smartphone,
  },
  {
    screen: 'signup',
    label: '회원가입 안내',
    description: '회원가입 절차를 안내합니다',
    icon: UserPlus,
  },
  {
    screen: 'vein-register',
    label: '지정맥 등록 안내',
    description: '지정맥 등록 방법을 안내합니다',
    icon: Fingerprint,
  },
  {
    screen: 'login',
    label: '로그인 안내',
    description: '지정맥/QR 로그인 방법을 안내합니다',
    icon: LogIn,
  },
  {
    screen: 'non-member',
    label: '비회원 안내',
    description: '비회원 체험 방법을 안내합니다',
    icon: User,
  },
  {
    screen: 'measurement-mode',
    label: '측정 시작 안내',
    description: '전체측정/선택측정 방법을 안내합니다',
    icon: ClipboardCheck,
  },
  {
    screen: 'measurement-equipment',
    label: '측정 장비 안내',
    description: '각 장비별 측정 방법을 안내합니다',
    icon: Stethoscope,
  },
  {
    screen: 'results',
    label: '결과 확인 안내',
    description: '측정 결과 확인 방법을 안내합니다',
    icon: FileBarChart,
  },
  {
    screen: 'completion',
    label: '실제 장비로 이동',
    description: '교육을 마치고 장비로 이동합니다',
    icon: ArrowRightCircle,
    cta: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Mobile horizontal-scroll category cards (9 items)                  */
/* ------------------------------------------------------------------ */
interface MobileCard {
  screen: Screen;
  label: string;
  desc: string;
  icon: React.ElementType;
}

const mobileCards: MobileCard[] = [
  { screen: 'equipment-intro', label: '장비 알아보기', desc: '측정 항목 소개', icon: Activity },
  { screen: 'location', label: '위치/설치', desc: '설치 위치 안내', icon: MapPin },
  { screen: 'app-install', label: '앱 설치', desc: '앱 설치 방법', icon: Smartphone },
  { screen: 'signup', label: '회원가입/로그인', desc: '가입 및 로그인', icon: UserPlus },
  { screen: 'vein-register', label: '지정맥 등록', desc: '등록 방법 안내', icon: Fingerprint },
  { screen: 'non-member', label: '비회원 안내', desc: '비회원 이용법', icon: User },
  { screen: 'measurement-mode', label: '측정 시작', desc: '측정 모드 안내', icon: ClipboardCheck },
  { screen: 'measurement-equipment', label: '장비별 안내', desc: '장비별 측정법', icon: Stethoscope },
  { screen: 'results', label: '결과 확인', desc: '결과 확인 방법', icon: FileBarChart },
];

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

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={themeStyle(content?.backgroundColor, content?.backgroundImageUrl)}
    >
      {/* Desktop-only header (mobile has bottom nav instead) */}
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
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.screen}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigateTo(item.screen)}
                  className={`
                    flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-colors md:p-6
                    ${
                      item.cta
                        ? 'col-span-3 border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-card hover:border-primary/40 hover:shadow-md'
                    }
                  `}
                >
                  <Icon
                    className={`h-8 w-8 shrink-0 ${item.cta ? 'text-primary-foreground' : 'text-primary'}`}
                  />
                  <span
                    className={`text-lg font-semibold ${item.cta ? 'text-primary-foreground' : 'text-foreground'}`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`text-sm ${item.cta ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                  >
                    {item.description}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Mobile: horizontally scrollable cards */}
          <div className="mt-4 md:hidden">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 kiosk-scroll">
              {mobileCards.map((card, i) => {
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
                      {card.desc}
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

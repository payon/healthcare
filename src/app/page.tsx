'use client';

import { Suspense, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useKioskStore, type Screen } from '@/store/kiosk-store';
import { AnimatePresence, motion } from 'framer-motion';
import { useTTS } from '@/hooks/use-tts';
import { KioskErrorBoundary } from '@/components/kiosk/KioskErrorBoundary';
import { StandbyScreen } from '@/components/kiosk/StandbyScreen';
import { MainMenu } from '@/components/kiosk/MainMenu';
import { EquipmentIntro } from '@/components/kiosk/screens/EquipmentIntro';
import { LocationGuide } from '@/components/kiosk/screens/LocationGuide';
import { AppInstall } from '@/components/kiosk/screens/AppInstall';
import { Signup } from '@/components/kiosk/screens/Signup';
import { VeinRegister } from '@/components/kiosk/screens/VeinRegister';
import { LoginGuide } from '@/components/kiosk/screens/LoginGuide';
import { NonMember } from '@/components/kiosk/screens/NonMember';
import { MeasurementMode } from '@/components/kiosk/screens/MeasurementMode';
import { MeasurementEquipment } from '@/components/kiosk/screens/MeasurementEquipment';
import { ResultsGuide } from '@/components/kiosk/screens/ResultsGuide';
import { CompletionScreen } from '@/components/kiosk/screens/CompletionScreen';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function ScreenRenderer({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'standby':
      return <StandbyScreen />;
    case 'main':
      return <MainMenu />;
    case 'equipment-intro':
      return <EquipmentIntro />;
    case 'location':
      return <LocationGuide />;
    case 'app-install':
      return <AppInstall />;
    case 'signup':
      return <Signup />;
    case 'vein-register':
      return <VeinRegister />;
    case 'login':
      return <LoginGuide />;
    case 'non-member':
      return <NonMember />;
    case 'measurement-mode':
      return <MeasurementMode />;
    case 'measurement-equipment':
      return <MeasurementEquipment />;
    case 'results':
      return <ResultsGuide />;
    case 'completion':
      return <CompletionScreen />;
    default:
      return <MainMenu />;
  }
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

const VALID_SCREENS: Screen[] = [
  'standby', 'main', 'equipment-intro', 'location', 'app-install', 'signup',
  'vein-register', 'login', 'non-member', 'measurement-mode',
  'measurement-equipment', 'results', 'completion',
];

function HomeInner() {
  const currentScreen = useKioskStore((s) => s.currentScreen);
  const fontSize = useKioskStore((s) => s.fontSize);
  const highContrast = useKioskStore((s) => s.highContrast);
  const setMobile = useKioskStore((s) => s.setMobile);
  const resetIdleTimer = useKioskStore((s) => s.resetIdleTimer);
  const sessionStarted = useKioskStore((s) => s.sessionStarted);

  // TTS - page.tsx에서만 autoSpeak: true (이중 재생 방지)
  useTTS({ autoSpeak: true });

  // Deep link (?screen=): PWA shortcuts/TWA entry points land on a session
  // with the requested screen instead of standby.
  const searchParams = useSearchParams();
  useEffect(() => {
    const target = searchParams.get('screen');
    if (!target || !VALID_SCREENS.includes(target as Screen) || target === 'standby') return;
    const state = useKioskStore.getState();
    if (state.sessionStarted) return;
    state.startSession();
    if (target !== 'main') state.navigateTo(target as Screen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setMobile]);

  // Reset idle timer on any user interaction
  const handleInteraction = useCallback(() => {
    if (sessionStarted) resetIdleTimer();
  }, [sessionStarted, resetIdleTimer]);

  useEffect(() => {
    if (!sessionStarted) return;
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, handleInteraction, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handleInteraction));
  }, [sessionStarted, handleInteraction]);

  // zoom + high-contrast: useEffect로 적용하여 hydration mismatch 방지
  const containerRef = useRef<HTMLDivElement>(null);
  const enterDoneRef = useRef(true);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const zoomValue = fontSize === 'normal' ? 1 : fontSize === 'large' ? 1.15 : 1.3;
    el.style.zoom = fontSize === 'normal' ? '' : String(zoomValue);
    el.classList.toggle('high-contrast', highContrast);
    el.classList.toggle('bg-background', currentScreen !== 'standby');
  }, [fontSize, highContrast, currentScreen]);

  // 애니메이션 failsafe: enter가 2.5초 안에 끝나지 않으면 강제 표시 + 원인 로그.
  // (모바일/키오스크에서 rAF 스로틀 등으로 화면이 opacity:0에 갇히는 유형 대응)
  useEffect(() => {
    enterDoneRef.current = false;
    containerRef.current?.classList.remove('anim-kill');
    const t = setTimeout(() => {
      if (!enterDoneRef.current) {
        containerRef.current?.classList.add('anim-kill');
        const state = useKioskStore.getState();
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: state.sessionId || 'standby',
            eventType: 'error',
            screen: state.currentScreen,
            detail: 'anim-failsafe: enter animation did not complete',
          }),
        }).catch(() => {});
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [currentScreen]);

  return (
    // NOTE: mode="wait"를 쓰지 않는다. exit 애니가 어떤 이유로든 끝나지 않으면
    // 새 화면이 영원히 마운트되지 않아(음성은 나옴) 빈 화면에 갇힌다.
    // sync 모드에서는 새 화면이 즉시 마운트되므로 해당 고장 유형이 구조적으로 불가하다.
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        key={currentScreen}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.15, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          enterDoneRef.current = true;
          containerRef.current?.classList.remove('anim-kill');
        }}
        className="min-h-screen flex flex-col"
      >
        <KioskErrorBoundary key={currentScreen}>
          <ScreenRenderer screen={currentScreen} />
        </KioskErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

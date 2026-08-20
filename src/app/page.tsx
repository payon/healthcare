'use client';

import { useEffect, useCallback } from 'react';
import { useKioskStore, type Screen } from '@/store/kiosk-store';
import { AnimatePresence, motion } from 'framer-motion';
import { useTTS } from '@/hooks/use-tts';
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
  const currentScreen = useKioskStore((s) => s.currentScreen);
  const fontSize = useKioskStore((s) => s.fontSize);
  const highContrast = useKioskStore((s) => s.highContrast);
  const setMobile = useKioskStore((s) => s.setMobile);
  const resetIdleTimer = useKioskStore((s) => s.resetIdleTimer);
  const sessionStarted = useKioskStore((s) => s.sessionStarted);

  // TTS hook (화면 전환 시 자동 읽기)
  const { speakIntro, speakFull } = useTTS();

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

  const fontSizeClass =
    fontSize === 'normal' ? '' : fontSize === 'large' ? 'text-[18px]' : 'text-[22px]';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScreen}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`min-h-screen flex flex-col ${fontSizeClass} ${highContrast ? 'high-contrast' : ''} ${currentScreen === 'standby' ? '' : 'bg-background'}`}
      >
        <ScreenRenderer screen={currentScreen} />
      </motion.div>
    </AnimatePresence>
  );
}

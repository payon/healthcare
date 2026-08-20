'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKioskStore, type Screen } from '@/store/kiosk-store';

const screenTitleMap: Record<Exclude<Screen, 'standby' | 'main'>, string> = {
  'equipment-intro': '장비 소개',
  'location': '설치 위치 안내',
  'app-install': '앱 설치 안내',
  'signup': '회원가입 안내',
  'vein-register': '지정맥 등록 안내',
  'login': '로그인 안내',
  'non-member': '비회원 안내',
  'measurement-mode': '측정 모드 안내',
  'measurement-equipment': '측정 장비 안내',
  'results': '결과 확인 안내',
  'completion': '교육 완료',
};

export function KioskHeader() {
  const { currentScreen, goBack, goHome } = useKioskStore();

  // Don't render on standby or main menu
  if (currentScreen === 'standby' || currentScreen === 'main') {
    return null;
  }

  const title = screenTitleMap[currentScreen] || '';

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-0 z-50 flex w-full items-center gap-3 border-b bg-background px-4 py-3 md:px-8"
    >
      <Button
        variant="ghost"
        size="icon"
        className="min-h-12 min-w-12 shrink-0"
        onClick={goBack}
        aria-label="뒤로 가기"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <h1 className="flex-1 truncate text-xl font-bold md:text-2xl">
        {title}
      </h1>

      <Button
        variant="ghost"
        size="icon"
        className="min-h-12 min-w-12 shrink-0"
        onClick={goHome}
        aria-label="홈으로 가기"
      >
        <Home className="h-6 w-6" />
      </Button>
    </motion.header>
  );
}

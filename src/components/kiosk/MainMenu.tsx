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
import { useKioskStore, type Screen } from '@/store/kiosk-store';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';

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

export function MainMenu() {
  const { navigateTo } = useKioskStore();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <KioskHeader />

      <main className="flex-1 overflow-y-auto kiosk-scroll px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 text-2xl font-bold md:text-3xl"
          >
            무엇을 도와드릴까요?
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 md:grid-cols-3"
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
                        ? 'col-span-2 md:col-span-3 border-primary bg-primary text-primary-foreground hover:bg-primary/90'
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

          {/* Notice box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="notice-box mt-6"
          >
            <p className="text-sm leading-relaxed">
              <span className="mr-1 font-semibold">안내:</span>
              본 교육 키오스크는 안내 목적이며, 실제 측정은 현장 Biogram MINI 장비에서 진행됩니다.
            </p>
          </motion.div>
        </div>
      </main>

      <KioskFooter />
    </div>
  );
}

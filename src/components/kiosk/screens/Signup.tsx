'use client';

import { motion } from 'framer-motion';
import { UserPlus, Smartphone, Fingerprint, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { DbStepCards } from '@/components/kiosk/DbStepCards';
import { useKioskContent, useScreenSteps } from '@/hooks/use-kiosk-content';

interface SignupStep {
  icon: React.ElementType;
  title: string;
  descriptions: string[];
}

const steps: SignupStep[] = [
  {
    icon: UserPlus,
    title: '회원 시작하기',
    descriptions: [
      'Biogram MINI 장비 화면에서 [회원 시작하기] 버튼을 선택합니다.',
    ],
  },
  {
    icon: Smartphone,
    title: '휴대폰 번호 입력',
    descriptions: [
      '가입한 휴대폰 번호를 입력합니다.',
      '인증번호가 발송되면 번호를 확인합니다.',
    ],
  },
  {
    icon: Fingerprint,
    title: '지정맥 등록',
    descriptions: [
      '오른손 가운데 손가락으로 지정맥을 등록합니다.',
      '총 4회 등록을 진행합니다.',
    ],
  },
  {
    icon: CheckCircle,
    title: '가입 완료',
    descriptions: [
      '모든 등록이 완료되면 회원가입이 완료됩니다.',
      '이후 지정맥 로그인으로 간편하게 이용할 수 있습니다.',
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function Signup() {
  const { getContent } = useKioskContent();
  const content = getContent('signup');
  const dbSteps = useScreenSteps('signup');

  return (
    <ContentLayout
      title={content?.title || '회원가입 안내'}
      notice="회원가입은 실제 Biogram MINI 장비에서 진행됩니다. 본 교육 키오스크에서는 가입 절차만 안내합니다."
      backgroundColor={content?.backgroundColor}
      backgroundImageUrl={content?.backgroundImageUrl}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Intro */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-lg leading-relaxed text-muted-foreground"
        >
          {content?.body ||
            '회원가입을 통해 측정 이력을 관리하고 건강 변화를 추적할 수 있습니다.'}
        </motion.p>

        {/* Steps: admin sections win, hardcoded fallback otherwise */}
        {dbSteps ? (
          <DbStepCards steps={dbSteps} />
        ) : (
          steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div key={step.title} variants={itemVariants}>
              <Card className="kiosk-card">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <div className="mt-2 space-y-1">
                      {step.descriptions.map((desc, i) => (
                        <p
                          key={i}
                          className="text-base leading-relaxed text-muted-foreground"
                        >
                          {desc}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
          })
        )}
      </motion.div>
    </ContentLayout>
  );
}

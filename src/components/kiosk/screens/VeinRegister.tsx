'use client';

import { motion } from 'framer-motion';
import { Hand, Scan, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { DbStepCards } from '@/components/kiosk/DbStepCards';
import { useKioskContent, useScreenSteps } from '@/hooks/use-kiosk-content';

interface VeinStep {
  icon: React.ElementType;
  title: string;
  descriptions: string[];
}

const steps: VeinStep[] = [
  {
    icon: Hand,
    title: '손가락 선택',
    descriptions: ['오른손 가운데 손가락을 사용합니다.'],
  },
  {
    icon: Scan,
    title: '센서에 손가락 올리기',
    descriptions: ['지정맥 센서 위에 손가락을 올려놓습니다.'],
  },
  {
    icon: RotateCcw,
    title: '4회 등록',
    descriptions: [
      '안내음에 따라 4번 반복하여 등록합니다.',
      '매번 손가락을 올렸다가 내렸다가 합니다.',
    ],
  },
  {
    icon: CheckCircle,
    title: '등록 완료',
    descriptions: ['4회 등록이 완료되면 지정맥 등록이 완료됩니다.'],
  },
];

const precautions = [
  '손가락을 구부리지 마세요',
  '옆 센서에 맞춰 반듯하게 살짝 올려놓으세요',
  '손가락에 힘을 주지 마세요',
  '장갑을 벗고 등록해 주세요',
  '물기가 있으면 닦은 후 등록해 주세요',
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

export function VeinRegister() {
  const { getContent } = useKioskContent();
  const content = getContent('vein-register');
  const dbSteps = useScreenSteps('vein-register');

  return (
    <ContentLayout
      title={content?.title || '지정맥 등록 안내'}
      notice="지정맥 등록은 실제 Biogram MINI 장비에서 진행됩니다."
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
            '지정맥 등록은 손가락 정맥 패턴을 등록하여 간편 로그인을 위한 과정입니다.'}
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

        {/* Warning box */}
        <motion.div variants={itemVariants}>
          <div className="warning-box">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">주의사항</h3>
            </div>
            <ul className="space-y-2">
              {precautions.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-base leading-relaxed"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </ContentLayout>
  );
}

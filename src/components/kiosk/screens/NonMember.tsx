'use client';

import { motion } from 'framer-motion';
import {
  User,
  ChevronRight,
  Edit,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { DbStepCards } from '@/components/kiosk/DbStepCards';
import { useKioskContent, useScreenSteps } from '@/hooks/use-kiosk-content';

interface NonMemberStep {
  icon: React.ElementType;
  title: string;
  descriptions: string[];
}

const steps: NonMemberStep[] = [
  {
    icon: User,
    title: '비회원 체험하기 선택',
    descriptions: [
      'Biogram MINI 장비 화면에서 [비회원 체험하기] 버튼을 선택합니다.',
    ],
  },
  {
    icon: ChevronRight,
    title: '계속 버튼 선택',
    descriptions: ['안내 내용 확인 후 [계속] 버튼을 선택합니다.'],
  },
  {
    icon: Edit,
    title: '기본 정보 입력',
    descriptions: [
      '성별을 선택합니다.',
      '생년 4자리를 입력합니다.',
      '키를 입력합니다.',
    ],
  },
  {
    icon: Play,
    title: '측정 시작',
    descriptions: ['입력 완료 후 측정을 시작할 수 있습니다.'],
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

export function NonMember() {
  const { getContent } = useKioskContent();
  const content = getContent('non-member');
  const dbSteps = useScreenSteps('non-member');

  return (
    <ContentLayout
      title={content?.title || '비회원 안내'}
      notice="비회원 측정은 실제 Biogram MINI 장비에서 진행됩니다."
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
          {content?.body || '앱 가입 없이도 비회원으로 체험 측정을 이용할 수 있습니다.'}
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

        {/* Warning Box */}
        <motion.div variants={itemVariants}>
          <div className="warning-box">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">주의</h3>
            </div>
            <p className="text-base leading-relaxed">
              비회원으로 측정한 데이터는 저장되지 않으며, 관리자도 확인할 수
              없습니다. 측정 결과를 저장하려면 회원가입을 권장합니다.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </ContentLayout>
  );
}

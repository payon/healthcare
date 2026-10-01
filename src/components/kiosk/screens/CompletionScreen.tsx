'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, MapPin, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { useKioskContent, useScreenSteps, stepText } from '@/hooks/use-kiosk-content';
import { useKioskStore } from '@/store/kiosk-store';

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

const summaryItems = [
  'Biogram MINI 측정 항목 이해',
  '앱 설치 및 회원가입 방법',
  '지정맥 등록 및 로그인 방법',
  '전체측정과 선택측정 차이',
  '장비별 측정 준비사항 및 주의사항',
  '결과 확인 방법',
];

export function CompletionScreen() {
  const startSession = useKioskStore((state) => state.startSession);
  const { getContent } = useKioskContent();
  const content = getContent('completion');
  const dbSteps = useScreenSteps('completion');
  const summary = dbSteps ? dbSteps.map(stepText) : summaryItems;

  return (
    <ContentLayout
      title={content?.title || '교육 완료'}
      backgroundColor={content?.backgroundColor}
      backgroundImageUrl={content?.backgroundImageUrl}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Success Icon */}
        <motion.div
          className="flex flex-col items-center"
          variants={itemVariants}
        >
          <CheckCircle className="mb-6 h-24 w-24 text-primary" />
          <h2 className="text-center text-3xl font-bold md:text-4xl">
            교육을 모두 완료하셨습니다!
          </h2>
        </motion.div>

        {/* Summary Card */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardContent className="p-6">
              <h3 className="mb-5 text-xl font-semibold">
                학습 내용 요약
              </h3>
              <ul className="space-y-4">
                {summary.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 text-lg"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="space-y-4">
          <button
            type="button"
            className="kiosk-btn-primary w-full min-h-20 text-xl"
            onClick={startSession}
          >
            실제 장비에서 측정 시작하기
            <ArrowRight className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="kiosk-btn-secondary w-full"
            onClick={startSession}
          >
            처음으로 돌아가기
          </button>
        </motion.div>

        {/* Location Reminder */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3 rounded-xl bg-muted px-6 py-5"
        >
          <MapPin className="h-6 w-6 shrink-0 text-primary" />
          <span className="text-lg font-medium">
            장비 위치: 1층 로비 헬스케어 존
          </span>
        </motion.div>
      </motion.div>
    </ContentLayout>
  );
}

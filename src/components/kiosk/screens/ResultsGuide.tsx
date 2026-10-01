'use client';

import { motion } from 'framer-motion';
import { Monitor, Smartphone, Send, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { DbGroupCards } from '@/components/kiosk/DbGroupCards';
import { useKioskContent, useScreenGroups } from '@/hooks/use-kiosk-content';

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

const subSteps = [
  '바이오그램 앱을 실행합니다.',
  '메인 화면에서 최근 측정 결과를 확인합니다.',
  '과거 이력 탭에서 이전 결과와 비교합니다.',
];

export function ResultsGuide() {
  const { getContent } = useKioskContent();
  const content = getContent('results');
  const dbGroups = useScreenGroups('results');

  return (
    <ContentLayout
      imageUrl={content?.imageUrl}
      title={content?.title || '결과 확인 안내'}
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
          {content?.body || '측정 완료 후, 다음 방법으로 결과를 확인할 수 있습니다.'}
        </motion.p>

        {/* Method cards: admin groups win, hardcoded fallback otherwise */}
        {dbGroups ? (
          <DbGroupCards groups={dbGroups} />
        ) : (
        <>
        {/* Card 1: 장비 화면에서 확인 */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  장비 화면에서 확인
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-base leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  측정이 완료되면 Biogram MINI 장비 화면에 결과가
                  표시됩니다.
                </li>
                <li className="flex items-start gap-3 text-base leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  각 측정 항목별 수치와 종합 건강 점수를 확인할 수 있습니다.
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: 바이오그램 앱에서 확인 */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  바이오그램 앱에서 확인
                </h3>
              </div>
              <ul className="mb-6 space-y-3">
                <li className="flex items-start gap-3 text-base leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  회원으로 로그인한 경우, 바이오그램 앱에서도 결과를
                  확인할 수 있습니다.
                </li>
                <li className="flex items-start gap-3 text-base leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  과거 측정 이력과 비교하여 건강 변화를 추적할 수 있습니다.
                </li>
              </ul>
              {/* Sub-steps */}
              <div className="space-y-4">
                {subSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-base leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: 휴대폰으로 결과 받기 */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  휴대폰으로 결과 받기
                </h3>
              </div>
              <ul className="mb-4 space-y-3">
                <li className="flex items-start gap-3 text-base leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  측정 후 휴대폰으로 결과를 전송받을 수 있습니다.
                </li>
                <li className="flex items-start gap-3 text-base leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  다음 방법으로 결과를 받을 수 있습니다:
                </li>
              </ul>
              <div className="space-y-3 pl-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                  <Send className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="text-base">카카오톡으로 결과 받기</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                  <Smartphone className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="text-base">SMS로 결과 받기</span>
                </div>
              </div>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                실제 장비 화면에서 전송 방법을 선택하세요.
              </p>
            </CardContent>
          </Card>
        </motion.div>
        </>
        )}

        {/* Important Notice */}
        <motion.div variants={itemVariants}>
          <div className="notice-box">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">안내</h3>
            </div>
            <p className="text-base leading-relaxed">
              측정 결과는 실제 Biogram MINI 장비와 바이오그램 앱에서만
              확인할 수 있습니다. 본 교육 키오스크에서는 측정을 진행하지
              않으므로 결과를 제공하지 않습니다.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </ContentLayout>
  );
}

'use client';

import { motion } from 'framer-motion';
import { ClipboardCheck, GitBranch, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { useKioskContent, useScreenSteps, stepText, type MeasurementData } from '@/hooks/use-kiosk-content';

// ── Hardcoded fallback data ──

const flowItems = [
  { num: 1, label: '신장' },
  { num: 2, label: '스트레스' },
  { num: 3, label: '혈압' },
  { num: 4, label: '악력' },
  { num: 5, label: '체성분' },
  { num: 6, label: '피부' },
];

const selectFeatures = [
  '원하는 측정 항목만 선택하여 진행합니다.',
  '원하는 항목을 터치하여 선택합니다.',
  '선택한 항목만 측정이 진행됩니다.',
  '시간이 부족할 때 유용합니다.',
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

// ── Helper: render flow items from API data ──

function renderDynamicFlowItems(measurements: MeasurementData[]) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {measurements.map((item, index) => (
        <span key={item.id} className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: item.color || '#0d9488' }}
          >
            {index + 1}
          </span>
          <span className="text-base font-medium">{item.name}</span>
          {index < measurements.length - 1 && (
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
        </span>
      ))}
    </div>
  );
}

function renderFallbackFlowItems() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {flowItems.map((item, index) => (
        <span key={item.num} className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {item.num}
          </span>
          <span className="text-base font-medium">{item.label}</span>
          {index < flowItems.length - 1 && (
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
        </span>
      ))}
    </div>
  );
}

export function MeasurementMode() {
  const { measurements, getContent } = useKioskContent();
  const content = getContent('measurement-mode');
  const dbSteps = useScreenSteps('measurement-mode');
  const features = dbSteps ? dbSteps.map(stepText) : selectFeatures;

  // Use API data if available, otherwise fall back to hardcoded
  const hasApiMeasurements = measurements.length > 0;
  const totalEstimatedTime = hasApiMeasurements
    ? measurements.reduce((sum, m) => sum + m.estimatedTime, 0)
    : 0; // fallback shows "약 5~8분"

  return (
    <ContentLayout
      title={content?.title || '측정 모드 안내'}
      notice="측정은 실제 Biogram MINI 장비에서 진행됩니다. 장비 화면의 안내에 따라 측정을 시작하세요."
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
          {content?.body || 'Biogram MINI는 두 가지 측정 모드를 제공합니다.'}
        </motion.p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Card 1: 전체측정 */}
          <motion.div variants={itemVariants}>
            <Card className="kiosk-card h-full border-2 border-primary/40">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">전체측정</h3>
                </div>

                <p className="mb-5 text-base leading-relaxed text-muted-foreground">
                  모든 측정 항목을 순서대로 진행합니다.
                </p>

                {/* Flow Diagram - dynamic or fallback */}
                {hasApiMeasurements
                  ? renderDynamicFlowItems(measurements)
                  : renderFallbackFlowItems()}

                {/* Time Estimate */}
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-base font-medium">
                    {hasApiMeasurements
                      ? `약 ${totalEstimatedTime}분 소요`
                      : '약 5~8분 소요'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: 선택측정 */}
          <motion.div variants={itemVariants}>
            <Card className="kiosk-card h-full">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <GitBranch className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">선택측정</h3>
                </div>

                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-base leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </ContentLayout>
  );
}

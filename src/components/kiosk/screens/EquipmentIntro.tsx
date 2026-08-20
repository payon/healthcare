'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Brain,
  Heart,
  Hand,
  Scale,
  Sparkles,
  Ruler,
  Trophy,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';

interface MeasurementItem {
  icon: React.ElementType;
  name: string;
  description: string;
  colorClass: string;
}

const measurements: MeasurementItem[] = [
  {
    icon: Brain,
    name: '스트레스',
    description: '심박수 변이도를 분석하여 스트레스 수준을 측정합니다.',
    colorClass: 'measure-stress',
  },
  {
    icon: Heart,
    name: '혈압',
    description: '수축기 및 이완기 혈압을 측정합니다.',
    colorClass: 'measure-bp',
  },
  {
    icon: Hand,
    name: '악력',
    description: '악력계를 이용하여 손의 악력을 측정합니다.',
    colorClass: 'measure-grip',
  },
  {
    icon: Scale,
    name: '체성분',
    description: '체중, 체지방률, 근육량 등을 분석합니다.',
    colorClass: 'measure-body',
  },
  {
    icon: Sparkles,
    name: '피부',
    description: '피부 수분, 탄력 등 피부 상태를 측정합니다.',
    colorClass: 'measure-skin',
  },
  {
    icon: Ruler,
    name: '신장',
    description: '초음파 센서로 정확한 신장을 측정합니다.',
    colorClass: 'measure-height',
  },
  {
    icon: Trophy,
    name: '종합 점수',
    description: '모든 측정 결과를 바탕으로 종합 건강 점수를 산출합니다.',
    colorClass: 'border-l-4 border-l-primary',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function EquipmentIntro() {
  return (
    <ContentLayout
      title="장비 소개"
      notice="모든 측정은 실제 Biogram MINI 장비에서 진행됩니다."
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 overflow-hidden rounded-2xl"
      >
        <Image
          src="/kiosk-images/equipment.png"
          alt="Biogram MINI 헬스케어 장비"
          width={1344}
          height={768}
          className="h-auto w-full object-cover"
          priority
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6 text-lg leading-relaxed text-muted-foreground"
      >
        Biogram MINI는 6가지 항목을 측정하여 종합 건강 점수를 제공합니다.
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {measurements.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.name} variants={itemVariants}>
              <Card className={`kiosk-card ${item.colorClass}`}>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="mt-1 text-base text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </ContentLayout>
  );
}

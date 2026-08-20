'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Ruler,
  Heart,
  Hand,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';

interface EquipmentInfo {
  icon: React.ElementType;
  name: string;
  colorClass: string;
  preparation: string[];
  caution: string[];
}

const equipments: EquipmentInfo[] = [
  {
    icon: Brain,
    name: '스트레스 측정',
    colorClass: 'measure-stress',
    preparation: [
      '손을 깨끗하게 씻어주세요.',
      '측정 전 5분간 안정을 취해주세요.',
    ],
    caution: [
      '측정 중 움직이지 마세요.',
      '심호흡을 하며 편안한 상태를 유지하세요.',
    ],
  },
  {
    icon: Ruler,
    name: '신장 측정',
    colorClass: 'measure-height',
    preparation: [
      '신발을 벗어주세요.',
      '머리에 액세서리를 제거해주세요.',
    ],
    caution: [
      '똑바로 서서 정면을 바라보세요.',
      '머리를 기둥에 닿게 하세요.',
    ],
  },
  {
    icon: Heart,
    name: '혈압 측정',
    colorClass: 'measure-bp',
    preparation: [
      '5분간 앉아서 안정을 취해주세요.',
      '팔에 꽉 조이는 옷을 느슨하게 해주세요.',
    ],
    caution: [
      '측정 중 말하거나 움직이지 마세요.',
      '팔을 심장 높이에 맞춰주세요.',
    ],
  },
  {
    icon: Hand,
    name: '악력 측정',
    colorClass: 'measure-grip',
    preparation: ['악력계를 손에 쥡니다.'],
    caution: [
      '최대한 세게 쥐어주세요.',
      '양손 모두 측정합니다.',
    ],
  },
  {
    icon: Scale,
    name: '체성분 측정',
    colorClass: 'measure-body',
    preparation: [
      '신발과 양말을 벗어주세요.',
      '무거운 소지품을 내려놓으세요.',
    ],
    caution: [
      '측정판 위에 똑바로 서주세요.',
      '측정 중 움직이지 마세요.',
    ],
  },
  {
    icon: Sparkles,
    name: '피부 측정',
    colorClass: 'measure-skin',
    preparation: ['측정할 부위의 화장품을 닦아주세요.'],
    caution: [
      '피부 측정 센서에 손목 안쪽을 가볍게 대주세요.',
      '측정 중 움직이지 마세요.',
    ],
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

export function MeasurementEquipment() {
  return (
    <ContentLayout
      title="측정 장비 안내"
      notice="모든 측정은 실제 Biogram MINI 장비에서 진행됩니다. 장비의 음성 안내에 따라 진행해 주세요."
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6 text-lg leading-relaxed text-muted-foreground"
      >
        각 측정 장비의 준비사항과 주의사항을 확인하세요.
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {equipments.map((equip) => {
          const Icon = equip.icon;
          return (
            <motion.div key={equip.name} variants={itemVariants}>
              <Card className={`kiosk-card ${equip.colorClass}`}>
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{equip.name}</h3>
                  </div>

                  {/* Sub-sections */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* 준비사항 */}
                    <div>
                      <h4 className="mb-2 text-base font-semibold text-primary">
                        준비사항
                      </h4>
                      <ul className="space-y-2">
                        {equip.preparation.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-base leading-relaxed text-muted-foreground"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 주의사항 */}
                    <div>
                      <h4 className="mb-2 text-base font-semibold text-amber-600">
                        주의사항
                      </h4>
                      <ul className="space-y-2">
                        {equip.caution.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-base leading-relaxed text-muted-foreground"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
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

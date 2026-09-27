'use client';

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
import { ResponsiveImage } from '@/components/kiosk/ResponsiveImage';
import { useKioskContent, type MeasurementData } from '@/hooks/use-kiosk-content';

// ── Hardcoded fallback data ──

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

// ── Icon mapping for dynamic data ──

function renderMeasurementIcon(iconName: string, className: string, style?: React.CSSProperties) {
  switch (iconName) {
    case 'Brain': return <Brain className={className} style={style} />;
    case 'Heart': return <Heart className={className} style={style} />;
    case 'Hand': return <Hand className={className} style={style} />;
    case 'Scale': return <Scale className={className} style={style} />;
    case 'Sparkles': return <Sparkles className={className} style={style} />;
    case 'Ruler': return <Ruler className={className} style={style} />;
    case 'Trophy': return <Trophy className={className} style={style} />;
    default: return <Brain className={className} style={style} />;
  }
}

// ── Animation variants ──

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
  const { getContent, measurements: apiMeasurements } = useKioskContent();

  // Get equipment-intro content from API
  const content = getContent('equipment-intro');
  const hasApiContent = !!content;
  const hasApiMeasurements = apiMeasurements.length > 0;

  // Determine image source: API custom image or default
  const imageSrc = hasApiContent && content.imageUrl
    ? content.imageUrl
    : '/kiosk-images/equipment.png';

  // Admin-editable title/body/theme (fall back to hardcoded defaults)
  const title = content?.title || '장비 소개';

  // Determine description: API custom body or default
  const description = hasApiContent && content.body
    ? content.body
    : 'Biogram MINI는 6가지 항목을 측정하여 종합 건강 점수를 제공합니다.';

  // Build measurement items list: API or fallback
  const useFallbackMeasurements = !hasApiMeasurements;

  return (
    <ContentLayout
      title={title}
      notice="모든 측정은 실제 Biogram MINI 장비에서 진행됩니다."
      backgroundColor={content?.backgroundColor}
      backgroundImageUrl={content?.backgroundImageUrl}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 overflow-hidden rounded-2xl"
      >
        <ResponsiveImage
          src={imageSrc}
          fallbackSrc="/kiosk-images/equipment.png"
          alt="Biogram MINI 헬스케어 장비"
          width={1344}
          height={768}
          sizes="100vw"
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
        {description}
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {useFallbackMeasurements
          ? // Fallback hardcoded measurements
            measurements.map((item) => {
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
            })
          : // Dynamic API measurements
            apiMeasurements.map((item: MeasurementData) => {
              const borderColor = item.color || '#0d9488';
              return (
                <motion.div key={item.id} variants={itemVariants}>
                  <Card
                    className="kiosk-card"
                    style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
                  >
                    <CardContent className="flex items-start gap-4 p-6">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${borderColor}15` }}
                      >
                        {renderMeasurementIcon(item.icon, 'h-6 w-6', { color: borderColor })}
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

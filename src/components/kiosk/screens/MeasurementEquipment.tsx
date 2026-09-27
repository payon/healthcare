'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Ruler,
  Heart,
  Hand,
  Scale,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { ResponsiveImage } from '@/components/kiosk/ResponsiveImage';
import { useKioskContent, type MeasurementData, type EquipmentData } from '@/hooks/use-kiosk-content';

// ── Hardcoded fallback data ──

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

// ── Icon renderer for dynamic data ──

function renderMeasurementIcon(iconName: string, className: string, style?: React.CSSProperties) {
  // Use explicit switch to satisfy react-hooks/static-components rule
  switch (iconName) {
    case 'Brain': return <Brain className={className} style={style} />;
    case 'Ruler': return <Ruler className={className} style={style} />;
    case 'Heart': return <Heart className={className} style={style} />;
    case 'Hand': return <Hand className={className} style={style} />;
    case 'Scale': return <Scale className={className} style={style} />;
    case 'Sparkles': return <Sparkles className={className} style={style} />;
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

// ── Dynamic equipment card from API ──

function DynamicEquipmentCard({
  measurement,
  equipment,
}: {
  measurement: MeasurementData;
  equipment: EquipmentData;
}) {
  const borderColor = measurement.color || '#0d9488';

  return (
    <motion.div variants={itemVariants}>
      <Card className="kiosk-card" style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${borderColor}15` }}
            >
              {renderMeasurementIcon(measurement.icon, 'h-6 w-6', { color: borderColor })}
            </div>
            <h3 className="text-xl font-semibold">{equipment.name}</h3>
          </div>

          {/* Equipment image if available (SafeImage: bad admin URL never blanks the tree) */}
          {equipment.imageUrl && (
            <div className="mb-4 overflow-hidden rounded-lg">
              <ResponsiveImage
                src={equipment.imageUrl}
                fallbackSrc="/kiosk-images/equipment.png"
                alt={equipment.name}
                width={800}
                height={450}
                sizes="(max-width: 768px) 100vw, 800px"
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {equipment.description && (
            <p className="mb-4 text-base leading-relaxed text-muted-foreground">
              {equipment.description}
            </p>
          )}

          {/* Sub-sections */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* 준비사항 */}
            {equipment.preparationSteps.length > 0 && (
              <div>
                <h4 className="mb-2 text-base font-semibold text-primary">
                  준비사항
                </h4>
                <ol className="space-y-2">
                  {equipment.preparationSteps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-base leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 주의사항 */}
            {equipment.precautions.length > 0 && (
              <div>
                <h4 className="mb-2 text-base font-semibold text-amber-600">
                  주의사항
                </h4>
                <ul className="space-y-2">
                  {equipment.precautions.map((precaution, index) => {
                    const isWarning = precaution.level === 'warning' || precaution.level === 'danger';
                    return (
                      <li
                        key={index}
                        className={`flex items-start gap-2 text-base leading-relaxed ${
                          isWarning ? 'text-amber-700' : 'text-muted-foreground'
                        }`}
                      >
                        {isWarning ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                        )}
                        {precaution.text}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Fallback equipment card (hardcoded) ──

function FallbackEquipmentCard({ equip }: { equip: EquipmentInfo }) {
  const Icon = equip.icon;
  return (
    <motion.div variants={itemVariants}>
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
}

export function MeasurementEquipment() {
  const { measurements, getContent } = useKioskContent();
  const content = getContent('measurement-equipment');

  // Check if we have API measurements with equipment
  const hasApiData = measurements.length > 0 && measurements.some((m) => m.equipment.length > 0);

  return (
    <ContentLayout
      title={content?.title || '측정 장비 안내'}
      notice="모든 측정은 실제 Biogram MINI 장비에서 진행됩니다. 장비의 음성 안내에 따라 진행해 주세요."
      backgroundColor={content?.backgroundColor}
      backgroundImageUrl={content?.backgroundImageUrl}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6 text-lg leading-relaxed text-muted-foreground"
      >
        {content?.body || '각 측정 장비의 준비사항과 주의사항을 확인하세요.'}
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {hasApiData
          ? // Dynamic rendering from API
            measurements
              .filter((m) => m.equipment.length > 0)
              .flatMap((measurement) =>
                measurement.equipment.map((equipment) => (
                  <DynamicEquipmentCard
                    key={equipment.id}
                    measurement={measurement}
                    equipment={equipment}
                  />
                ))
              )
          : // Fallback hardcoded rendering
            equipments.map((equip) => (
              <FallbackEquipmentCard key={equip.name} equip={equip} />
            ))}
      </motion.div>
    </ContentLayout>
  );
}

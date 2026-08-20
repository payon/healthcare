'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';

const steps = [
  '1층 메인 엘리베이터에서 내립니다.',
  '로비 방향으로 안내 표지판을 따라 이동합니다.',
  '헬스케어 존에 도착하면 Biogram MINI 장비를 확인합니다.',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function LocationGuide() {
  return (
    <ContentLayout
      title="설치 위치 안내"
      notice="장비 위치는 변경될 수 있으며, 현장 안내 표지판을 확인해 주세요."
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Info card */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardContent className="p-6">
              <p className="text-lg leading-relaxed">
                Biogram MINI 장비는 다음 위치에 설치되어 있습니다.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location image */}
        <motion.div variants={itemVariants}>
          <div className="overflow-hidden rounded-xl">
            <Image
              src="/kiosk-images/location.png"
              alt="장비 설치 위치 - 1층 로비 헬스케어 존"
              width={1344}
              height={768}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </motion.div>

        {/* Location details card */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">위치</p>
                    <p className="mt-1 text-lg text-muted-foreground">
                      1층 로비 헬스케어 존
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">영업시간</p>
                    <p className="mt-1 text-lg text-muted-foreground">
                      평일 09:00 ~ 18:00
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Directions card */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Navigation className="h-5 w-5 text-primary" />
                찾아가는 길
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-lg leading-relaxed">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ContentLayout>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Search, Download, QrCode, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';

const storeSteps = [
  '휴대폰 앱스토어를 엽니다.',
  '검색창에 "바이오그램"을 입력합니다.',
  '검색 결과에서 바이오그램 앱을 선택합니다.',
  '설치 버튼을 눌러 앱을 설치합니다.',
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

export function AppInstall() {
  return (
    <ContentLayout title="앱 설치 안내">
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
          바이오그램 앱을 설치하면 측정 결과를 모바일에서 확인할 수 있습니다.
        </motion.p>

        {/* Method 1: App Store */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-5 w-5 text-primary" />
                앱스토어에서 검색
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {storeSteps.map((step, index) => (
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

        {/* Method 2: QR Code */}
        <motion.div variants={itemVariants}>
          <Card className="kiosk-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <QrCode className="h-5 w-5 text-primary" />
                QR 코드로 설치
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                {/* QR placeholder */}
                <div className="flex h-[200px] w-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted">
                  <QrCode className="h-12 w-12 text-muted-foreground/50" />
                  <span className="mt-2 text-base text-muted-foreground">
                    QR 코드
                  </span>
                </div>
                <p className="text-center text-lg leading-relaxed text-muted-foreground">
                  화면의 QR 코드를 휴대폰 카메라로 촬영하여 앱을 설치합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important notice */}
        <motion.div variants={itemVariants}>
          <div className="notice-box">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-base leading-relaxed">
                앱 설치 후 회원가입을 진행하면 측정 결과를 저장하고 언제든
                확인할 수 있습니다.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </ContentLayout>
  );
}

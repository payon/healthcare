'use client';

import { motion } from 'framer-motion';
import { Fingerprint, QrCode, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentLayout } from '@/components/kiosk/ContentLayout';
import { DbGroupCards } from '@/components/kiosk/DbGroupCards';
import { useKioskContent, useScreenGroups } from '@/hooks/use-kiosk-content';

interface LoginStep {
  title: string;
  description: string;
}

interface LoginMethod {
  icon: React.ElementType;
  title: string;
  steps: LoginStep[];
}

const loginMethods: LoginMethod[] = [
  {
    icon: Fingerprint,
    title: '지정맥 로그인',
    steps: [
      {
        title: '휴대폰 번호 입력',
        description: '장비 화면에서 휴대폰 번호를 입력합니다.',
      },
      {
        title: '지정맥 인증',
        description:
          '등록한 오른손 가운데 손가락을 지정맥 센서에 올립니다.',
      },
      {
        title: '로그인 완료',
        description: '인증이 완료되면 자동으로 로그인됩니다.',
      },
    ],
  },
  {
    icon: QrCode,
    title: 'QR 코드 로그인',
    steps: [
      {
        title: 'QR 코드 생성',
        description: '장비 화면에서 QR 코드를 생성합니다.',
      },
      {
        title: 'QR 코드 촬영',
        description: '휴대폰 카메라로 QR 코드를 촬영합니다.',
      },
      {
        title: '앱 실행 및 로그인',
        description:
          'URL을 선택하면 바이오그램 앱이 실행되며 자동 로그인됩니다.',
      },
    ],
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

export function LoginGuide() {
  const { getContent } = useKioskContent();
  const content = getContent('login');
  const dbGroups = useScreenGroups('login');

  return (
    <ContentLayout
      title={content?.title || '로그인 안내'}
      notice="로그인은 실제 Biogram MINI 장비에서 진행됩니다."
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
          {content?.body || '회원가입 완료 후, 다음 방법으로 로그인할 수 있습니다.'}
        </motion.p>

        {/* Login Method Cards: admin groups win, hardcoded fallback otherwise */}
        {dbGroups ? (
          <DbGroupCards groups={dbGroups} />
        ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loginMethods.map((method) => {
            const Icon = method.icon;
            return (
              <motion.div key={method.title} variants={itemVariants}>
                <Card className="kiosk-card h-full">
                  <CardContent className="p-6">
                    {/* Method Header */}
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{method.title}</h3>
                    </div>

                    {/* Steps */}
                    <div className="space-y-5">
                      {method.steps.map((step, index) => (
                        <div key={step.title} className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold">
                              {step.title}
                            </h4>
                            <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        )}

        {/* Warning Box */}
        <motion.div variants={itemVariants}>
          <div className="warning-box">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">참고</h3>
            </div>
            <p className="text-base leading-relaxed">
              지정맥 로그인 3~4회 실패 시 재등록 모드가 활성화됩니다. 이 경우
              다시 지정맥 등록을 진행해야 합니다.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </ContentLayout>
  );
}

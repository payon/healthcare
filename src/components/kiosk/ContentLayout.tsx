'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useKioskStore } from '@/store/kiosk-store';
import { themeStyle } from '@/lib/kiosk-theme';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';
import { MobileBottomNav } from './MobileBottomNav';
import { DesktopSidebar, SIDEBAR_OFFSET_CLASS } from './DesktopSidebar';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { useTTS } from '@/hooks/use-tts';

/** 대표 이미지 히어로. 16:9 고정 크롭으로 기기·원본 비율과 무관하게 일정하게 표시. */
function ContentHeroImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

interface ContentLayoutProps {
  title?: string;
  children: ReactNode;
  notice?: string;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  /** 대표 이미지 (관리자 콘텐츠 imageUrl). 설정된 화면에만 히어로로 표시 */
  imageUrl?: string | null;
}

export function ContentLayout({ title, children, notice, backgroundColor, backgroundImageUrl, imageUrl }: ContentLayoutProps) {
  const { isMobile } = useKioskStore();
  // autoSpeak 없음 = 자동 읽기 안 함, replay 버튼만 사용
  const { speakIntro, speakFull } = useTTS();

  return (
    <div
      className={`flex min-h-screen flex-col bg-background ${SIDEBAR_OFFSET_CLASS}`}
      style={themeStyle(backgroundColor, backgroundImageUrl)}
    >
      <DesktopSidebar />
      <KioskHeader />
      <AccessibilityToolbar onReplay={speakIntro} onReplayFull={speakFull} />

      <main className="flex-1 overflow-y-auto kiosk-scroll px-4 md:px-8 py-6 pb-bottom-nav md:pb-6">
        <div className="mx-auto max-w-4xl">
          {title && (
            <h2 className="mb-6 text-2xl font-bold md:text-3xl">
              {title}
            </h2>
          )}
          {imageUrl && <ContentHeroImage src={imageUrl} alt={title || '안내 이미지'} />}
          {children}
          {notice && (
            <div className="notice-box mt-8">
              <p className="text-sm leading-relaxed">
                <span className="mr-1 font-semibold">안내:</span>
                {notice}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Desktop footer, hidden on mobile (bottom nav replaces it) */}
      <div className="hidden md:block">
        <KioskFooter />
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}

'use client';

import { type ReactNode } from 'react';
import { useKioskStore } from '@/store/kiosk-store';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';
import { MobileBottomNav } from './MobileBottomNav';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { useTTS } from '@/hooks/use-tts';

interface ContentLayoutProps {
  title?: string;
  children: ReactNode;
  notice?: string;
}

export function ContentLayout({ title, children, notice }: ContentLayoutProps) {
  const { isMobile } = useKioskStore();
  const { speakIntro, speakFull } = useTTS();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <KioskHeader />
      <AccessibilityToolbar onReplay={speakIntro} onReplayFull={speakFull} />

      <main className="flex-1 overflow-y-auto kiosk-scroll px-4 md:px-8 py-6 pb-bottom-nav md:pb-6">
        <div className="mx-auto max-w-4xl">
          {title && (
            <h2 className="mb-6 text-2xl font-bold md:text-3xl">
              {title}
            </h2>
          )}
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

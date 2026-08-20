'use client';

import { type ReactNode } from 'react';
import { useKioskStore } from '@/store/kiosk-store';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';

interface ContentLayoutProps {
  title?: string;
  children: ReactNode;
  notice?: string;
}

export function ContentLayout({ title, children, notice }: ContentLayoutProps) {
  const { currentScreen } = useKioskStore();

  // Use custom title if provided, otherwise header uses its own mapping
  const headerTitle = title;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <KioskHeader />

      <main className="flex-1 overflow-y-auto kiosk-scroll px-4 md:px-8 py-6">
        <div className="mx-auto max-w-4xl">
          {headerTitle && (
            <h2 className="mb-6 text-2xl font-bold md:text-3xl">
              {headerTitle}
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

      <KioskFooter />
    </div>
  );
}

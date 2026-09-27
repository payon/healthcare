'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';

const LOGIN_PATH = '/admin/login';

/**
 * Admin shell wrapper that shows sidebar + header for authenticated pages,
 * and renders bare layout for the login page.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === LOGIN_PATH;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

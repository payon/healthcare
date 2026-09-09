'use client';

import { useCurrentUser } from '@/hooks/admin/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LOGIN_PATH = '/admin/login';

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  // Login page is always accessible without authentication
  const isLoginPage = pathname === LOGIN_PATH;

  useEffect(() => {
    // Only redirect to login if not already on login page and not authenticated
    if (!isLoginPage && !isLoading && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [isLoginPage, isLoading, user, router]);

  // Login page renders directly without auth check
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-80">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

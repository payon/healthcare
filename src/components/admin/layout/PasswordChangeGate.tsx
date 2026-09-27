'use client';

import { useCurrentUser } from '@/hooks/admin/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { ChangePasswordForm } from './ChangePasswordForm';

/**
 * Forced password-change gate. Rendered instead of admin content while
 * me.mustChangePassword is true (all other APIs return 403 anyway).
 */
export function PasswordChangeGate() {
  const { data: user } = useCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl">비밀번호 변경 필요</CardTitle>
          <CardDescription>
            {user?.email} — 보안을 위해 먼저 비밀번호를 변경하세요.
            변경 전에는 다른 기능을 사용할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

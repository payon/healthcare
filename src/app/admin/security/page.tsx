'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/admin/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Smartphone, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ChangePasswordForm } from '@/components/admin/layout/ChangePasswordForm';

export default function SecurityPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [setup, setSetup] = useState<{ otpauthUrl: string; qrDataUrl: string } | null>(null);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '시작에 실패했습니다');
      return data as { otpauthUrl: string; qrDataUrl: string };
    },
    onSuccess: (data) => setSetup(data),
    onError: (err: Error) => toast.error(err.message),
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/2fa/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '활성화에 실패했습니다');
      return true;
    },
    onSuccess: () => {
      toast.success('2단계 인증이 켜졌습니다');
      setSetup(null);
      setToken('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/2fa/setup', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '해제에 실패했습니다');
      return true;
    },
    onSuccess: () => {
      toast.success('2단계 인증이 꺼졌습니다');
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copySecret = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.otpauthUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">보안 설정</h2>
        <p className="mt-1 text-sm text-slate-500">
          내 계정의 2단계 인증과 비밀번호를 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            2단계 인증 (TOTP)
          </CardTitle>
          <CardDescription>
            Google Authenticator·Microsoft Authenticator 등 인증 앱 사용
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">상태:</span>
            {user?.totpEnabled ? (
              <Badge className="bg-emerald-600">켜짐</Badge>
            ) : (
              <Badge variant="secondary">꺼짐</Badge>
            )}
          </div>

          {!user?.totpEnabled && !setup && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {startMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="mr-2 h-4 w-4" />
              )}
              설정 시작하기
            </Button>
          )}

          {!user?.totpEnabled && setup && (
            <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
                <li>인증 앱에서 QR 스캔 또는 키 직접 입력</li>
                <li>표시되는 6자리 코드를 아래에 입력</li>
              </ol>
              <div className="flex justify-center">
                <img
                  src={setup.qrDataUrl}
                  alt="2FA 등록 QR 코드"
                  className="h-48 w-48 rounded-lg border border-slate-200"
                />
              </div>
              <Button variant="outline" size="sm" onClick={copySecret} className="w-full">
                {copied ? (
                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="mr-1 h-3.5 w-3.5" />
                )}
                설정 키 복사 (QR 대신 직접 입력용)
              </Button>
              <div className="space-y-2">
                <Label htmlFor="2fa-token">6자리 코드</Label>
                <Input
                  id="2fa-token"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <Button
                onClick={() => enableMutation.mutate()}
                disabled={enableMutation.isPending || token.length < 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {enableMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                확인하고 켜기
              </Button>
            </div>
          )}

          {user?.totpEnabled && (
            <Button
              variant="outline"
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              2단계 인증 끄기
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">비밀번호 변경</CardTitle>
          <CardDescription>
            12자 이상·대소문자+숫자+특수문자, 유출된 비밀번호 사용 불가.
            변경 시 다른 기기의 세션은 모두 종료됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm
            onSuccess={() => toast.success('비밀번호가 변경되었습니다')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

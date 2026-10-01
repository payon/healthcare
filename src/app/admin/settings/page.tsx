'use client';

import { useCurrentUser } from '@/hooks/admin/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Monitor, Clock, Loader2, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const [ttsRate, setTtsRate] = useState('0.85');
  const [ttsVoiceURI, setTtsVoiceURI] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.settings ?? []) as Array<{ key: string; value: string }>;
        for (const r of rows) {
          if (r.key === 'tts.rate') setTtsRate(r.value || '0.85');
          if (r.key === 'tts.voiceURI') setTtsVoiceURI(r.value);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const saveTts = async () => {
    const rate = parseFloat(ttsRate);
    if (!Number.isFinite(rate) || rate < 0.5 || rate > 1.5) {
      toast.error('속도는 0.5~1.5 사이로 입력하세요');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'tts.rate', value: String(rate) },
            { key: 'tts.voiceURI', value: ttsVoiceURI.trim() },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장에 실패했습니다');
      toast.success('TTS 설정이 저장되었습니다 (키오스크에 수 초 내 반영)');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  // Only superadmin can access settings
  if (user && user.role !== 'superadmin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto mb-3 text-slate-400" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          접근 권한이 없습니다
        </h3>
        <p className="text-sm text-slate-500">
          설정 페이지는 최고관리자만 접근할 수 있습니다
        </p>
        <button
          onClick={() => router.push('/admin')}
          className="mt-4 text-sm text-emerald-600 hover:underline"
        >
          대시보드로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">설정</h2>

      {/* System info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            시스템 정보
          </CardTitle>
          <CardDescription>Biogram MINI 헬스케어 장비 이용 교육 키오스크</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-500">버전</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">1.0.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">프레임워크</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Next.js 16</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">데이터베이스</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">PostgreSQL (Prisma ORM)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">현재 사용자</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.name} ({user?.email})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            보안 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">JWT 시크릿</p>
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
              ••••••••••••••••
            </p>
            <p className="text-xs text-slate-400">보안상 마스킹 처리됨</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm text-slate-500">세션 만료 시간</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">8시간 (활동 시 연장, 최대 24시간) · 기기당 5세션</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm text-slate-500">계정 잠금 정책</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              5회 실패 시 15분 잠금
            </p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm text-slate-500">비밀번호 해시</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              bcryptjs (salt rounds: 12)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Kiosk settings placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            키오스크 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">콘텐츠 새로고침 주기</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              5초
            </p>
            <p className="text-xs text-slate-400">키오스크에서 콘텐츠를 자동 새로고침하는 주기입니다</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">음성 안내 속도</p>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0.5}
                max={1.5}
                step={0.05}
                value={ttsRate}
                disabled={loadingSettings}
                onChange={(e) => setTtsRate(e.target.value)}
                className="w-32"
              />
              <span className="self-center text-xs text-slate-400">0.5 (느리게) ~ 1.5 (빠르게)</span>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="tts-voice">선호 음성 (voiceURI, 비우면 한국어 자동 선택)</Label>
            <Input
              id="tts-voice"
              placeholder="예: Google 한국의"
              value={ttsVoiceURI}
              disabled={loadingSettings}
              onChange={(e) => setTtsVoiceURI(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              키오스크 브라우저의 음성 목록에서 정확히 일치하는 항목을 사용합니다
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={saveTts}
              disabled={saving || loadingSettings}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              TTS 설정 저장
            </Button>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm text-slate-500">유휴 시간 제한</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              120초
            </p>
            <p className="text-xs text-slate-400">사용자 입력이 없으면 메인 화면으로 복귀합니다</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">음성 안내 (TTS)</p>
              <p className="text-xs text-slate-400">화면 전환 시 자동 음성 안내</p>
            </div>
            <Badge variant="default" className="text-xs">활성</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Role permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            역할 권한
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { role: '최고관리자', desc: '모든 권한', variant: 'destructive' as const },
              { role: '관리자', desc: '설정 수정 제외 모든 권한', variant: 'default' as const },
              { role: '편집자', desc: '콘텐츠, 측정 항목, 이미지 관리', variant: 'secondary' as const },
              { role: '조회자', desc: '콘텐츠, 측정 항목 조회', variant: 'outline' as const },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={item.variant} className="text-xs">{item.role}</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, RotateCcw, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface PwaIcon {
  slot: string;
  size: number;
  purpose: string;
  label: string;
  description: string;
  defaultUrl: string;
  url: string;
  isDefault: boolean;
  updatedAt: string;
}

export default function PwaIconsPage() {
  const [icons, setIcons] = useState<PwaIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [targetSlot, setTargetSlot] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    setIsLoading(true);
    fetch('/api/admin/icons')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.icons) setIcons(data.icons);
      })
      .catch(() => toast.error('아이콘 목록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const uploadIcon = async (slot: string, file: File) => {
    setBusySlot(slot);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/admin/icons/${slot}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다');
      toast.success(`${slot} 아이콘이 교체되었습니다 (PWA에 1시간 내 반영)`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다');
    } finally {
      setBusySlot(null);
    }
  };

  const restoreDefault = async (slot: string) => {
    setBusySlot(slot);
    try {
      const res = await fetch(`/api/admin/icons/${slot}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '복원에 실패했습니다');
      toast.success('기본 아이콘으로 복원되었습니다');
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '복원에 실패했습니다');
    } finally {
      setBusySlot(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-24 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          PWA 아이콘 관리
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          모바일·태블릿·데스크탑·21/32인치 키오스크의 홈화면 설치 아이콘입니다.
          정사각형 PNG/JPG 권장 (서버에서 기기별 규격으로 자동 변환).
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f && targetSlot) void uploadIcon(targetSlot, f);
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {icons.map((icon) => (
          <Card key={icon.slot}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-slate-400" />
                  {icon.label}
                </CardTitle>
                {icon.isDefault ? (
                  <Badge variant="secondary">기본값</Badge>
                ) : (
                  <Badge variant="default" className="bg-emerald-600">변경됨</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {icon.size}×{icon.size}px · {icon.purpose} · {icon.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <img
                    src={icon.url}
                    alt={icon.label}
                    className="h-20 w-20 rounded-lg object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busySlot !== null}
                    onClick={() => { setTargetSlot(icon.slot); fileRef.current?.click(); }}
                  >
                    {busySlot === icon.slot ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    이미지로 교체
                  </Button>
                  {!icon.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busySlot !== null}
                      onClick={() => restoreDefault(icon.slot)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      기본값 복원
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

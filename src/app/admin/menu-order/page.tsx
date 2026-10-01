'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, RotateCcw, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Screen } from '@/store/kiosk-store';
import { DEFAULT_MENU_ORDER, MENU_SCREEN_LABELS } from '@/lib/menu-order';

export default function MenuOrderPage() {
  const [order, setOrder] = useState<Screen[]>(DEFAULT_MENU_ORDER);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/menu-order')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) setOrder(data.order as Screen[]);
        setIsDefault(data?.isDefault ?? true);
      })
      .catch(() => toast.error('메뉴 순서를 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, []);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setOrder(next);
  };

  const moveTo = (index: number, pos: 'top' | 'bottom') => {
    const next = [...order];
    const [item] = next.splice(index, 1);
    if (pos === 'top') next.unshift(item);
    else next.push(item);
    setOrder(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/menu-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장에 실패했습니다');
      setOrder(data.order as Screen[]);
      setIsDefault(false);
      toast.success('저장되었습니다 (키오스크에 수 초 내 반영)');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setOrder(DEFAULT_MENU_ORDER);
    toast.info('기본 순서로 되돌렸습니다. 저장해야 적용됩니다');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">메뉴 순서</h2>
          <p className="mt-1 text-sm text-slate-500">
            키오스크 메인 화면의 메뉴 표시 순서입니다. 저장 즉시 키오스크에 반영됩니다.
            {isDefault && ' (현재 기본 순서 사용 중)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            초기화
          </Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            저장
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">표시 순서</CardTitle>
          <CardDescription>위에서부터 순서대로 키오스크에 표시됩니다. ‘실제 장비로 이동’은 항상 맨 마지막에 고정됩니다. 모바일 하단 탭에는 상위 4개가, 나머지는 ‘더보기’ 화면에 표시됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="divide-y divide-slate-200 dark:divide-slate-800">
            {order.map((screen, i) => (
              <li key={screen} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {MENU_SCREEN_LABELS[screen] ?? screen}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => moveTo(i, 'top')} disabled={i === 0} aria-label="맨 위로">
                    <ChevronsUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="아래로">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveTo(i, 'bottom')} disabled={i === order.length - 1} aria-label="맨 아래로">
                    <ChevronsDown className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

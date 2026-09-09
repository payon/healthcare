'use client';

import { useMeasurementList, useDeleteMeasurement } from '@/hooks/admin/use-measurements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Activity, Edit, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function MeasurementListPage() {
  const { data: measurements, isLoading } = useMeasurementList();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteMeasurement(deleteId ?? '');

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync();
      toast.success('측정 항목이 삭제되었습니다');
      setDeleteId(null);
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-24" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          측정 항목 관리
        </h2>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/admin/measurements/new">
            <Plus className="h-4 w-4 mr-2" />
            새 측정 항목
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {measurements?.map((m) => (
          <Card key={m.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                  <CardTitle className="text-base">{m.name}</CardTitle>
                </div>
                <Badge variant={m.isActive ? 'default' : 'outline'} className="text-xs shrink-0">
                  {m.isActive ? '활성' : '비활성'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>키</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {m.key}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>아이콘</span>
                  <span>{m.icon || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>예상 시간</span>
                  <span>{m.estimatedTime}분</span>
                </div>
                <div className="flex justify-between">
                  <span>장비 수</span>
                  <span>{m.equipment.length}개</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/admin/measurements/${m.id}`}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    편집
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>측정 항목 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{m.name}&quot; 항목을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteId(null)}>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {measurements?.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>등록된 측정 항목이 없습니다</p>
        </div>
      )}
    </div>
  );
}

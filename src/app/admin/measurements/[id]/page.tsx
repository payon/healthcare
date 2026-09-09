'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  useMeasurementDetail,
  useUpdateMeasurement,
  useCreateMeasurement,
  useDeleteMeasurement,
} from '@/hooks/admin/use-measurements';
import {
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
} from '@/hooks/admin/use-equipment';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { MeasurementEquipment } from '@/hooks/admin/use-measurements';

const measurementFormSchema = z.object({
  key: z.string().min(1, '키를 입력하세요').max(50),
  name: z.string().min(1, '이름을 입력하세요').max(100),
  description: z.string(),
  icon: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '유효한 색상 코드를 입력하세요'),
  order: z.coerce.number().int().min(0),
  estimatedTime: z.coerce.number().int().min(1),
  isActive: z.boolean(),
});

type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

const equipmentFormSchema = z.object({
  name: z.string().min(1, '장비명을 입력하세요').max(100),
  description: z.string(),
  order: z.coerce.number().int().min(0),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export default function MeasurementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';

  const { data: measurement, isLoading } = useMeasurementDetail(isNew ? '' : id);
  const updateMutation = useUpdateMeasurement(isNew ? '' : id);
  const createMutation = useCreateMeasurement();
  const deleteMeasurementMutation = useDeleteMeasurement(isNew ? '' : id);

  // Equipment mutations
  const createEquipMutation = useCreateEquipment(isNew ? '' : id);
  const [editEquipId, setEditEquipId] = useState<string | null>(null);
  const updateEquipMutation = useUpdateEquipment(isNew ? '' : id, editEquipId ?? '');
  const [deleteEquipId, setDeleteEquipId] = useState<string | null>(null);
  const deleteEquipMutation = useDeleteEquipment(isNew ? '' : id, deleteEquipId ?? '');

  // Measurement form
  const {
    register: registerM,
    handleSubmit: handleSubmitM,
    reset: resetM,
    watch: watchM,
    formState: { errors: errorsM, isDirty: isDirtyM },
  } = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      key: '',
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      order: 0,
      estimatedTime: 5,
      isActive: true,
    },
  });

  const isActiveWatch = watchM('isActive');
  const colorWatch = watchM('color');

  useEffect(() => {
    if (measurement) {
      resetM({
        key: measurement.key,
        name: measurement.name,
        description: measurement.description,
        icon: measurement.icon,
        color: measurement.color,
        order: measurement.order,
        estimatedTime: measurement.estimatedTime,
        isActive: measurement.isActive,
      });
    }
  }, [measurement, resetM]);

  const onSubmitMeasurement = (data: MeasurementFormValues) => {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  useEffect(() => {
    if (createMutation.isSuccess) {
      toast.success('측정 항목이 생성되었습니다');
      router.push('/admin/measurements');
    }
    if (updateMutation.isSuccess) toast.success('측정 항목이 저장되었습니다');
  }, [createMutation.isSuccess, updateMutation.isSuccess, router]);

  useEffect(() => {
    if (createMutation.isError) toast.error(createMutation.error.message || '생성 실패');
    if (updateMutation.isError) toast.error(updateMutation.error.message || '저장 실패');
  }, [createMutation.isError, createMutation.error, updateMutation.isError, updateMutation.error]);

  // Equipment dialog
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<MeasurementEquipment | null>(null);
  const [prepSteps, setPrepSteps] = useState<string[]>(['']);
  const [precautions, setPrecautions] = useState<string[]>(['']);

  const {
    register: registerE,
    handleSubmit: handleSubmitE,
    reset: resetE,
    formState: { errors: errorsE },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: { name: '', description: '', order: 0 },
  });

  const openEquipDialog = (equip?: MeasurementEquipment) => {
    if (equip) {
      setEditingEquip(equip);
      setEditEquipId(equip.id);
      resetE({ name: equip.name, description: equip.description, order: equip.order });
      setPrepSteps(equip.preparationSteps.length > 0 ? equip.preparationSteps : ['']);
      setPrecautions(equip.precautions.length > 0 ? equip.precautions : ['']);
    } else {
      setEditingEquip(null);
      setEditEquipId(null);
      resetE({ name: '', description: '', order: 0 });
      setPrepSteps(['']);
      setPrecautions(['']);
    }
    setEquipDialogOpen(true);
  };

  const onSubmitEquipment = (data: EquipmentFormValues) => {
    const steps = prepSteps.filter((s) => s.trim());
    const cautions = precautions.filter((s) => s.trim());
    const payload = {
      ...data,
      preparationSteps: steps,
      precautions: cautions,
      imageUrl: null,
    };

    if (editingEquip) {
      updateEquipMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('장비가 수정되었습니다');
          setEquipDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
      });
    } else {
      createEquipMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('장비가 추가되었습니다');
          setEquipDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const handleDeleteEquip = async () => {
    if (!deleteEquipId) return;
    try {
      await deleteEquipMutation.mutateAsync();
      toast.success('장비가 삭제되었습니다');
      setDeleteEquipId(null);
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/measurements')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록
        </Button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isNew ? '새 측정 항목' : measurement?.name ?? '측정 항목 편집'}
        </h2>
      </div>

      {/* Measurement form */}
      <form onSubmit={handleSubmitM(onSubmitMeasurement)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">키</Label>
                <Input id="key" placeholder="blood-pressure" {...registerM('key')} />
                {errorsM.key && <p className="text-sm text-destructive">{errorsM.key.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input id="name" placeholder="혈압" {...registerM('name')} />
                {errorsM.name && <p className="text-sm text-destructive">{errorsM.name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" rows={3} {...registerM('description')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">아이콘</Label>
                <Input id="icon" placeholder="Heart" {...registerM('icon')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">색상</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={colorWatch}
                    onChange={(e) => {
                      const val = e.target.value;
                      registerM('color').onChange({ target: { value: val } } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    className="h-9 w-9 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input id="color" {...registerM('color')} className="flex-1" />
                </div>
                {errorsM.color && <p className="text-sm text-destructive">{errorsM.color.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">순서</Label>
                <Input id="order" type="number" {...registerM('order')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">예상 시간 (분)</Label>
                <Input id="estimatedTime" type="number" {...registerM('estimatedTime')} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Switch
                  id="isActive"
                  checked={isActiveWatch}
                  onCheckedChange={(checked) => {
                    registerM('isActive').onChange({ target: { value: checked } } as React.ChangeEvent<HTMLInputElement>);
                  }}
                />
                <Label htmlFor="isActive">활성</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={(isNew ? createMutation.isPending : updateMutation.isPending) || (!isNew && !isDirtyM)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {(isNew ? createMutation.isPending : updateMutation.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isNew ? '생성' : '저장'}
          </Button>
        </div>
      </form>

      {/* Equipment section (only for existing measurement) */}
      {!isNew && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">장비 목록</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEquipDialog()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                장비 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {measurement?.equipment.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                등록된 장비가 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {measurement?.equipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-start justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {eq.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          순서 {eq.order}
                        </Badge>
                      </div>
                      {eq.description && (
                        <p className="text-sm text-slate-500">{eq.description}</p>
                      )}
                      <div className="flex gap-3 text-xs text-slate-400 mt-1">
                        <span>준비 {eq.preparationSteps.length}단계</span>
                        <span>주의 {eq.precautions.length}항목</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEquipDialog(eq)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteEquipId(eq.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>장비 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{eq.name}&quot; 장비를 정말 삭제하시겠습니까?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteEquipId(null)}>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteEquip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equipment dialog */}
      <Dialog open={equipDialogOpen} onOpenChange={setEquipDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEquip ? '장비 편집' : '새 장비'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitE(onSubmitEquipment)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eq-name">장비명</Label>
              <Input id="eq-name" {...registerE('name')} />
              {errorsE.name && <p className="text-sm text-destructive">{errorsE.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eq-desc">설명</Label>
              <Textarea id="eq-desc" rows={2} {...registerE('description')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eq-order">순서</Label>
              <Input id="eq-order" type="number" {...registerE('order')} />
            </div>

            {/* Preparation steps */}
            <div className="space-y-2">
              <Label>준비 단계</Label>
              <div className="space-y-2">
                {prepSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-sm text-slate-400 w-6 text-right pt-2">{idx + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => {
                        const next = [...prepSteps];
                        next[idx] = e.target.value;
                        setPrepSteps(next);
                      }}
                      placeholder="준비 단계를 입력하세요"
                      className="flex-1"
                    />
                    {prepSteps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setPrepSteps(prepSteps.filter((_, i) => i !== idx))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPrepSteps([...prepSteps, ''])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  단계 추가
                </Button>
              </div>
            </div>

            {/* Precautions */}
            <div className="space-y-2">
              <Label>주의사항</Label>
              <div className="space-y-2">
                {precautions.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-sm text-slate-400 w-6 text-right pt-2">!</span>
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...precautions];
                        next[idx] = e.target.value;
                        setPrecautions(next);
                      }}
                      placeholder="주의사항을 입력하세요"
                      className="flex-1"
                    />
                    {precautions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setPrecautions(precautions.filter((_, i) => i !== idx))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPrecautions([...precautions, ''])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  주의사항 추가
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEquipDialogOpen(false)}>
                취소
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createEquipMutation.isPending || updateEquipMutation.isPending}
              >
                {(createEquipMutation.isPending || updateEquipMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingEquip ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

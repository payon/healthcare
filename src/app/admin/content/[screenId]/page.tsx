'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContentDetail, useUpdateContent, useCreateSection, useUpdateSection, useDeleteSection, type ContentSection } from '@/hooks/admin/use-content';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { linkOrPathField } from '@/lib/admin/schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Save, Upload, Plus, Pencil, Trash2, X, Images } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';

const HEX_COLOR = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const contentEditSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  body: z.string(),
  imageUrl: linkOrPathField('유효한 URL 또는 / 로 시작하는 경로를 입력하세요').nullable(),
  qrCodeUrl: linkOrPathField('유효한 URL 또는 / 로 시작하는 경로를 입력하세요').nullable(),
  backgroundColor: z
    .string()
    .refine((v) => v === '' || HEX_COLOR.test(v), 'HEX 색상(#RGB/#RRGGBB) 형식이어야 합니다')
    .nullable(),
  backgroundImageUrl: linkOrPathField('유효한 URL 또는 / 로 시작하는 경로를 입력하세요').nullable(),
  mapImageUrl: linkOrPathField('유효한 URL 또는 / 로 시작하는 경로를 입력하세요').nullable(),
});

type ContentEditForm = z.infer<typeof contentEditSchema>;

// ── Image library picker (uploaded webp library → fill URL field) ──

interface LibraryImage {
  url: string;
  filename: string;
  width: number;
  height: number;
}

function ImageLibraryPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/admin/images?limit=60')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.images) setImages(data.images);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open ]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          <h3 className="font-semibold">라이브러리에서 선택</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : images.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              라이브러리가 비어 있습니다. 이미지 관리에서 먼저 업로드하세요.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => { onSelect(img.url); onClose(); }}
                  className="group overflow-hidden rounded-lg border border-slate-200 hover:border-emerald-500 dark:border-slate-700"
                  title={img.filename}
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="truncate px-2 py-1 text-[11px] text-slate-500">
                    {img.width}×{img.height}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sections manager (step lists consumed live by kiosk screens) ──

const sectionFormSchema = z.object({
  sectionKey: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, '영문 소문자/숫자/하이픈만 사용하세요'),
  title: z.string().min(1, '제목을 입력하세요').max(200),
  body: z.string().max(20000),
  imageUrl: linkOrPathField('유효한 URL 또는 / 로 시작하는 경로를 입력하세요'),
  order: z.coerce.number().int().min(0),
});

type SectionForm = z.infer<typeof sectionFormSchema>;

function SectionsManager({ screenId, sections }: { screenId: string; sections: ContentSection[] }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const createMutation = useCreateSection(screenId);
  const updateMutation = useUpdateSection(screenId, editingKey ?? '');
  const deleteMutation = useDeleteSection(screenId);

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectionForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(sectionFormSchema as any),
    defaultValues: { sectionKey: '', title: '', body: '', imageUrl: '', order: 0 },
  });

  const openAdd = () => {
    setEditingKey(null);
    setAdding(true);
    reset({ sectionKey: '', title: '', body: '', imageUrl: '', order: sorted.length });
  };

  const openEdit = (s: ContentSection) => {
    setAdding(false);
    setEditingKey(s.sectionKey);
    reset({ sectionKey: s.sectionKey, title: s.title, body: s.body, imageUrl: s.imageUrl ?? '', order: s.order });
  };

  const close = () => {
    setAdding(false);
    setEditingKey(null);
  };

  const onSubmit = (data: SectionForm) => {
    const payload = {
      title: data.title,
      body: data.body,
      imageUrl: data.imageUrl || null,
      order: data.order,
    };
    if (adding) {
      createMutation.mutate(
        { sectionKey: data.sectionKey, ...payload },
        {
          onSuccess: () => { toast.success('섹션이 생성되었습니다'); close(); },
          onError: (err) => toast.error(err.message),
        }
      );
    } else {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success('섹션이 저장되었습니다'); close(); },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const onDelete = (key: string) => {
    if (!confirm('이 섹션을 삭제할까요?')) return;
    deleteMutation.mutate(key, {
      onSuccess: () => toast.success('섹션이 삭제되었습니다'),
      onError: (err) => toast.error(err.message),
    });
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">단계 목록 (키오스크 단계 카드에 즉시 반영)</CardTitle>
          {!adding && !editingKey && (
            <Button type="button" variant="outline" size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              섹션 추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && !adding && (
          <p className="text-sm text-slate-500">
            등록된 섹션이 없습니다. 추가하면 키오스크의 고정 단계 목록 대신 표시됩니다.
            본문은 줄바꿈으로 여러 줄을 입력하세요.
          </p>
        )}
        {sorted.map((s) => (
          <div
            key={s.sectionKey}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">
              {s.order}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.title}</p>
              <p className="truncate text-xs text-slate-500">{s.sectionKey}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(s)} aria-label="섹션 수정">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(s.sectionKey)}
              aria-label="섹션 삭제"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        {(adding || editingKey) && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border border-emerald-200 p-4 dark:border-emerald-800">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>섹션 키</Label>
                <Input placeholder="step-1" {...register('sectionKey')} disabled={!adding} />
                {errors.sectionKey && <p className="text-xs text-destructive">{errors.sectionKey.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>순서</Label>
                <Input type="number" min={0} {...register('order')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>제목</Label>
              <Input {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>본문 (줄바꿈으로 여러 줄)</Label>
              <Textarea rows={4} {...register('body')} />
            </div>
            <div className="space-y-1">
              <Label>이미지 URL (선택)</Label>
              <Input placeholder="https://..." {...register('imageUrl')} />
              {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={close}>
                <X className="h-4 w-4 mr-1" />
                취소
              </Button>
              <Button type="submit" size="sm" disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                저장
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const screenId = params.screenId as string;

  const { data: content, isLoading } = useContentDetail(screenId);
  const updateMutation = useUpdateContent(screenId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ContentEditForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contentEditSchema as any),
  });

  const imageUrlValue = watch('imageUrl');
  const bgColorValue = watch('backgroundColor');
  const bgImageValue = watch('backgroundImageUrl');
  const mapImageValue = watch('mapImageUrl');
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'imageUrl' | 'backgroundImageUrl' | 'mapImageUrl'>('imageUrl');
  const [pickerTarget, setPickerTarget] = useState<'imageUrl' | 'backgroundImageUrl' | 'mapImageUrl' | null>(null);

  // 필드 초기화 → 빈값 저장 시 키오스크는 번들 기본 이미지/기본 테마로 폴백
  const resetField = (field: 'imageUrl' | 'qrCodeUrl' | 'backgroundImageUrl' | 'mapImageUrl') => {
    setValue(field, '', { shouldDirty: true, shouldValidate: true });
  };

  // Resize-optimized upload (sharp→webp, ≤5MB): returns a link URL applied to the field
  const uploadImage = async (file: File) => {
    setUploading(uploadTarget);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'content');
      const res = await fetch('/api/admin/images/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다');
      setValue(uploadTarget, data.image.url, { shouldDirty: true, shouldValidate: true });
      toast.success('업로드 완료 (리사이즈 적용됨)');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다');
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    if (content) {
      reset({
        title: content.title,
        body: content.body,
        imageUrl: content.imageUrl ?? '',
        qrCodeUrl: content.qrCodeUrl ?? '',
        backgroundColor: content.backgroundColor ?? '',
        backgroundImageUrl: content.backgroundImageUrl ?? '',
        mapImageUrl: content.mapImageUrl ?? '',
      });
    }
  }, [content, reset]);

  const onSubmit = (data: ContentEditForm) => {
    updateMutation.mutate({
      title: data.title,
      body: data.body,
      imageUrl: data.imageUrl || null,
      qrCodeUrl: data.qrCodeUrl || null,
      backgroundColor: data.backgroundColor || null,
      backgroundImageUrl: data.backgroundImageUrl || null,
      mapImageUrl: data.mapImageUrl || null,
    });
  };

  useEffect(() => {
    if (updateMutation.isSuccess) {
      toast.success('콘텐츠가 저장되었습니다');
    }
  }, [updateMutation.isSuccess]);

  useEffect(() => {
    if (updateMutation.isError) {
      toast.error(updateMutation.error.message || '저장에 실패했습니다');
    }
  }, [updateMutation.isError, updateMutation.error]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>콘텐츠를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/content')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록
        </Button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {content.title}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">본문</Label>
              <Textarea id="body" rows={8} {...register('body')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">이미지 URL (링크 또는 업로드)</Label>
              <div className="flex gap-2">
                <Input id="imageUrl" placeholder="https://... 또는 업로드/라이브러리" {...register('imageUrl')} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerTarget('imageUrl')}
                  title="라이브러리에서 선택"
                >
                  <Images className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading !== null}
                  onClick={() => { setUploadTarget('imageUrl'); fileRef.current?.click(); }}
                >
                  {uploading === 'imageUrl' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                {imageUrlValue ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => resetField('imageUrl')}
                    title="기본 이미지로 초기화"
                  >
                    초기화
                  </Button>
                ) : null}
              </div>
              {errors.imageUrl && (
                <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
              )}
              {imageUrlValue && (
                <div className="mt-2">
                  <img
                    src={imageUrlValue}
                    alt="미리보기"
                    className="max-w-xs max-h-40 rounded-lg border border-slate-200 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qrCodeUrl">QR 코드 URL</Label>
              <div className="flex gap-2">
                <Input id="qrCodeUrl" placeholder="https://..." {...register('qrCodeUrl')} className="flex-1" />
                {watch('qrCodeUrl') ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => resetField('qrCodeUrl')}
                    title="기본값으로 초기화"
                  >
                    초기화
                  </Button>
                ) : null}
              </div>
              {errors.qrCodeUrl && (
                <p className="text-sm text-destructive">{errors.qrCodeUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">화면 테마 (키오스크에 즉시 반영)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">배경색 (HEX, 비우면 화면 기본값)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColorValue && HEX_COLOR.test(bgColorValue) ? bgColorValue : '#0d9488'}
                  onChange={(e) => setValue('backgroundColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
                  className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-transparent"
                  aria-label="배경색 선택"
                />
                <Input
                  id="backgroundColor"
                  placeholder="#0d9488"
                  {...register('backgroundColor')}
                  className="flex-1"
                />
                {bgColorValue ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setValue('backgroundColor', '', { shouldDirty: true, shouldValidate: true })}
                  >
                    지우기
                  </Button>
                ) : null}
              </div>
              {errors.backgroundColor && (
                <p className="text-sm text-destructive">{errors.backgroundColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundImageUrl">배경 이미지 URL (설정 시 배경색보다 우선, cover)</Label>
              <div className="flex gap-2">
                <Input id="backgroundImageUrl" placeholder="https://... 또는 업로드/라이브러리" {...register('backgroundImageUrl')} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerTarget('backgroundImageUrl')}
                  title="라이브러리에서 선택"
                >
                  <Images className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading !== null}
                  onClick={() => { setUploadTarget('backgroundImageUrl'); fileRef.current?.click(); }}
                >
                  {uploading === 'backgroundImageUrl' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                {bgImageValue ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => resetField('backgroundImageUrl')}
                    title="기본 테마로 초기화"
                  >
                    초기화
                  </Button>
                ) : null}
              </div>
              {errors.backgroundImageUrl && (
                <p className="text-sm text-destructive">{errors.backgroundImageUrl.message}</p>
              )}
              {bgImageValue && (
                <div className="mt-2">
                  <img
                    src={bgImageValue}
                    alt="배경 미리보기"
                    className="max-w-xs max-h-40 rounded-lg border border-slate-200 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapImageUrl">위치 지도 이미지 (location 화면 “찾아오는 길 지도” 전용)</Label>
              <div className="flex gap-2">
                <Input id="mapImageUrl" placeholder="https://... 또는 업로드/라이브러리" {...register('mapImageUrl')} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerTarget('mapImageUrl')}
                  title="라이브러리에서 선택"
                >
                  <Images className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading !== null}
                  onClick={() => { setUploadTarget('mapImageUrl'); fileRef.current?.click(); }}
                >
                  {uploading === 'mapImageUrl' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                {mapImageValue ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => resetField('mapImageUrl')}
                    title="지도 블록 숨기기"
                  >
                    초기화
                  </Button>
                ) : null}
              </div>
              {errors.mapImageUrl && (
                <p className="text-sm text-destructive">{errors.mapImageUrl.message}</p>
              )}
              {mapImageValue && (
                <div className="mt-2">
                  <img
                    src={mapImageValue}
                    alt="지도 미리보기"
                    className="max-w-xs max-h-40 rounded-lg border border-slate-200 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void uploadImage(f);
          }}
        />

        <SectionsManager screenId={screenId} sections={content.sections ?? [] } />

        <ImageLibraryPicker
          open={pickerTarget !== null}
          onClose={() => setPickerTarget(null)}
          onSelect={(url) => {
            if (pickerTarget) setValue(pickerTarget, url, { shouldDirty: true, shouldValidate: true });
          }}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </form>
    </div>
  );
}

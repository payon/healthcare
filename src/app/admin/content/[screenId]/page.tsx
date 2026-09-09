'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContentDetail, useUpdateContent } from '@/hooks/admin/use-content';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

const contentEditSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  body: z.string(),
  imageUrl: z.string().url('유효한 URL을 입력하세요').or(z.literal('')).nullable(),
  qrCodeUrl: z.string().url('유효한 URL을 입력하세요').or(z.literal('')).nullable(),
});

type ContentEditForm = z.infer<typeof contentEditSchema>;

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
    formState: { errors, isDirty },
  } = useForm<ContentEditForm>({
    resolver: zodResolver(contentEditSchema),
  });

  const imageUrlValue = watch('imageUrl');

  useEffect(() => {
    if (content) {
      reset({
        title: content.title,
        body: content.body,
        imageUrl: content.imageUrl ?? '',
        qrCodeUrl: content.qrCodeUrl ?? '',
      });
    }
  }, [content, reset]);

  const onSubmit = (data: ContentEditForm) => {
    updateMutation.mutate({
      title: data.title,
      body: data.body,
      imageUrl: data.imageUrl || null,
      qrCodeUrl: data.qrCodeUrl || null,
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
              <Label htmlFor="imageUrl">이미지 URL</Label>
              <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
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
              <Input id="qrCodeUrl" placeholder="https://..." {...register('qrCodeUrl')} />
              {errors.qrCodeUrl && (
                <p className="text-sm text-destructive">{errors.qrCodeUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

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

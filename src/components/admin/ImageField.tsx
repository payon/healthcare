'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Images, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LibraryImage {
  url: string;
  filename: string;
  width: number;
  height: number;
}

/**
 * 관리자 이미지 입력 공용 필드: URL 직접 입력 + 파일 업로드 + 라이브러리 선택 + 미리보기.
 * 장비 대화상자 안에서 써도 되는 fixed 오버레이 피커 사용 (Radix 중첩 이슈 없음).
 */
export function AdminImageField({
  id,
  label,
  value,
  onChange,
  category,
  showLibrary = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  category: 'general' | 'content' | 'equipment' | 'banner';
  showLibrary?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);

  useEffect(() => {
    if (!libraryOpen) return;
    let cancelled = false;
    setLoadingLib(true);
    fetch('/api/admin/images?limit=60')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.images) setImages(data.images);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingLib(false);
      });
    return () => {
      cancelled = true;
    };
  }, [libraryOpen]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      const res = await fetch('/api/admin/images/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다');
      onChange(data.url as string);
      toast.success('이미지가 업로드되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          placeholder="https://... 또는 업로드/라이브러리"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          업로드
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {showLibrary && (
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setLibraryOpen(true)}>
            <Images className="h-3.5 w-3.5 mr-1" />
            선택
          </Button>
        )}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            title="비우기"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value ? (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="미리보기" className="h-full w-full object-cover" />
        </div>
      ) : null}
      {libraryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setLibraryOpen(false)}>
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-semibold">라이브러리에서 선택</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLibraryOpen(false)} aria-label="닫기">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {loadingLib ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : images.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  라이브러리가 비어 있습니다. 먼저 업로드하세요.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => { onChange(img.url); setLibraryOpen(false); }}
                      className="group overflow-hidden rounded-lg border border-slate-200 hover:border-emerald-500 dark:border-slate-700"
                      title={img.filename}
                    >
                      <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.filename} className="h-full w-full object-cover" loading="lazy" />
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
      )}
    </div>
  );
}

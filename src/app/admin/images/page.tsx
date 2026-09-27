'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Image as ImageIcon, Copy, Check, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedImage {
  id?: string;
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  variants?: Array<{ url: string; width: number }>;
  usedIn?: string[];
}

/** 갤러리 표시용: 가장 작은 variant(빠름), 없으면 원본 */
export function libraryThumb(img: UploadedImage): string {
  if (img.variants && img.variants.length > 0) {
    return [...img.variants].sort((a, b) => a.width - b.width)[0].url;
  }
  return img.url;
}

export default function ImagesPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ totalCount: number; totalBytes: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    fetch('/api/admin/images?limit=60')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.images) setImages(data.images);
        if (data?.storage) setStorage(data.storage);
      })
      .catch(() => {});
  }, []);

  // DB 라이브러리 불러오기 (새로고침해도 유지)
  useEffect(() => {
    reload();
  }, [reload]);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'general');

      const res = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다');

      reload();
      toast.success(`${file.name} 업로드 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)
    );
    if (validFiles.length === 0) {
      toast.error('지원되는 이미지 파일만 업로드할 수 있습니다');
      return;
    }
    validFiles.forEach(uploadFile);
  }, [uploadFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('URL이 복사되었습니다');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  const deleteImage = async (id: string, filename: string) => {
    if (!confirm(`"${filename}"을(를) 삭제할까요? 파일도 디스크에서 지워집니다.`)) return;
    try {
      const res = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제에 실패했습니다');
      const freedKB = ((data.freedBytes ?? 0) / 1024).toFixed(1);
      toast.success(`삭제되었습니다 (${freedKB}KB 회수)`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제에 실패했습니다');
    }
  };

  const cleanupOrphans = async () => {
    if (!confirm('어느 화면에서도 쓰이지 않는 이미지를 모두 삭제할까요?')) return;
    try {
      const res = await fetch('/api/admin/images/cleanup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '정리에 실패했습니다');
      const freedMB = ((data.freedBytes ?? 0) / 1024 / 1024).toFixed(2);
      toast.success(`${data.deleted}개 삭제, ${freedMB}MB 회수`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '정리에 실패했습니다');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          이미지 관리
        </h2>
        <div className="flex items-center gap-2">
          {storage && (
            <Badge variant="secondary">
              {storage.totalCount}개 · {(storage.totalBytes / 1024 / 1024).toFixed(1)}MB 사용 중
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={cleanupOrphans}>
            미사용 정리
          </Button>
        </div>
      </div>

      {/* Upload area */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                <p className="text-sm text-slate-600">업로드 중...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-600">
                  드래그 앤 드롭 또는 클릭하여 이미지 업로드
                </p>
                <p className="text-xs text-slate-400">
                  JPG, PNG, GIF, WebP 지원 (SVG는 보안상 차단, 5MB 이하)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image gallery */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">업로드된 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800">
                    <img
                      src={libraryThumb(img)}
                      alt={img.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {img.filename}
                    </p>
                    {img.usedIn && img.usedIn.length > 0 && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate" title={img.usedIn.join(', ')}>
                        사용 중: {img.usedIn.join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {img.width}×{img.height}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {(img.size / 1024).toFixed(1)}KB
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyUrl(img.url)}
                      >
                        {copiedUrl === img.url ? (
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 mr-1" />
                        )}
                        URL 복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => img.id && deleteImage(img.id, img.filename)}
                        aria-label={`${img.filename} 삭제`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {images.length === 0 && !isUploading && (
        <div className="text-center py-12 text-slate-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>업로드된 이미지가 없습니다</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ContentSection {
  id: string;
  contentId: string;
  sectionKey: string;
  title: string;
  body: string;
  imageUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface KioskContent {
  id: string;
  section: string;
  title: string;
  body: string;
  imageUrl: string | null;
  qrCodeUrl: string | null;
  updatedAt: string;
  createdAt: string;
  sections: ContentSection[];
}

export function useContentList() {
  return useQuery({
    queryKey: ['admin', 'content'],
    queryFn: async () => {
      const res = await fetch('/api/admin/content');
      if (!res.ok) throw new Error('콘텐츠 목록을 가져오지 못했습니다');
      const data = await res.json();
      return data.contents as KioskContent[];
    },
  });
}

export function useContentDetail(screenId: string) {
  return useQuery({
    queryKey: ['admin', 'content', screenId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/content/${screenId}`);
      if (!res.ok) throw new Error('콘텐츠를 가져오지 못했습니다');
      const data = await res.json();
      return data.content as KioskContent;
    },
    enabled: !!screenId,
  });
}

export function useUpdateContent(screenId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title?: string;
      body?: string;
      imageUrl?: string | null;
      qrCodeUrl?: string | null;
    }) => {
      const res = await fetch(`/api/admin/content/${screenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '콘텐츠 수정에 실패했습니다');
      return result.content as KioskContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', screenId] });
    },
  });
}

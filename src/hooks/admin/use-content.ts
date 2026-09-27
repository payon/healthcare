'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ContentSection {
  id: string;
  contentId: string;
  sectionKey: string;
  title: string;
  body: string;
  imageUrl: string | null;
  parentKey: string;
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
  backgroundColor: string;
  backgroundImageUrl: string | null;
  mapImageUrl: string | null;
  ttsIntro: string;
  ttsFull: string;
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

export function useUpdateContent(screenId: string) {  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title?: string;
      body?: string;
      imageUrl?: string | null;
      qrCodeUrl?: string | null;
      backgroundColor?: string | null;
      backgroundImageUrl?: string | null;
      mapImageUrl?: string | null;
      ttsIntro?: string | null;
      ttsFull?: string | null;
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

export interface SectionInput {
  sectionKey: string;
  title: string;
  body?: string;
  imageUrl?: string | null;
  parentKey?: string;
  order?: number;
}

function sectionUrl(screenId: string, key?: string) {
  return key
    ? `/api/admin/content/${screenId}/sections/${key}`
    : `/api/admin/content/${screenId}/sections`;
}

export function useCreateSection(screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SectionInput) => {
      const res = await fetch(sectionUrl(screenId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '섹션 생성에 실패했습니다');
      return result.section as ContentSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', screenId] });
    },
  });
}

export function useUpdateSection(screenId: string, key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title?: string; body?: string; imageUrl?: string | null; parentKey?: string; order?: number }) => {
      const res = await fetch(sectionUrl(screenId, key), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '섹션 수정에 실패했습니다');
      return result.section as ContentSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', screenId] });
    },
  });
}

export function useDeleteSection(screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(sectionUrl(screenId, key), { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '섹션 삭제에 실패했습니다');
      return result as { success: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', screenId] });
    },
  });
}

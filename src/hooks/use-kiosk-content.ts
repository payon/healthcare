'use client';

import { useQuery } from '@tanstack/react-query';

// ── Types ──

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

export interface KioskContentData {
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
  sections: ContentSection[];
  updatedAt: string;
  createdAt: string;
}

export interface EquipmentData {
  id: string;
  measurementId: string;
  name: string;
  description: string;
  preparationSteps: string[];
  precautions: { level: string; text: string }[];
  imageUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  imageUrl: string | null;
  estimatedTime: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  equipment: EquipmentData[];
}

// ── Polling interval ──
const KIOSK_REFETCH_INTERVAL = 5000; // 5 seconds for real-time admin updates

// ── Hook ──

export function useKioskContent() {
  const contentQuery = useQuery({
    queryKey: ['kiosk', 'content'],
    queryFn: async () => {
      const res = await fetch('/api/content');
      if (!res.ok) throw new Error('콘텐츠를 가져오지 못했습니다');
      return res.json() as Promise<KioskContentData[]>;
    },
    staleTime: 3000, // Consider stale after 3s so polling can refresh
    gcTime: 5 * 60 * 1000,
    refetchInterval: KIOSK_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    retry: 1,
    // 폴링(isFetching 토글) 때마다 전 트리가 리렌더되어 저사양 기기가
    // 버벅이던 문제 대응: 데이터·에러·최초로딩 변경 때만 통지
    notifyOnChangeProps: ['data', 'error', 'isPending'],
  });

  const measurementQuery = useQuery({
    queryKey: ['kiosk', 'measurements'],
    queryFn: async () => {
      const res = await fetch('/api/measurements');
      if (!res.ok) throw new Error('측정 항목을 가져오지 못했습니다');
      return res.json() as Promise<MeasurementData[]>;
    },
    staleTime: 3000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: KIOSK_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    retry: 1,
    notifyOnChangeProps: ['data', 'error', 'isPending'],
  });

  const contents = contentQuery.data ?? [];
  const measurements = measurementQuery.data ?? [];
  const isLoading = contentQuery.isLoading || measurementQuery.isLoading;

  /**
   * Get content for a specific screen section.
   * Section keys match the admin content management identifiers,
   * e.g. "equipment-intro", "measurement-mode", "location-guide", etc.
   */
  function getContent(section: string): KioskContentData | null {
    return contents.find((c) => c.section === section) ?? null;
  }

  return {
    contents,
    measurements,
    getContent,
    isLoading,
    isContentError: contentQuery.isError,
    isMeasurementError: measurementQuery.isError,
  };
}

export interface ScreenStep {
  title: string;
  lines: string[];
  imageUrl: string | null;
  order: number;
}

/**
 * Admin-managed step list for a screen (ContentSection rows with parentKey="",
 * ordered by `order`). Card-style steps use `title` + `lines`.
 */
export function useScreenSteps(section: string): ScreenStep[] | null {
  const { contents } = useKioskContent();
  const content = contents.find((c) => c.section === section);
  const rows = (content?.sections ?? []).filter((s) => !s.parentKey);
  if (rows.length === 0) return null;
  return [...rows]
    .sort((a, b) => a.order - b.order)
    .map(toStep);
}

export interface ScreenGroup {
  key: string;
  title: string;
  imageUrl: string | null;
  order: number;
  children: ScreenStep[];
}

/**
 * Nested groups: sections with parentKey="<groupKey>" attach to the group
 * section whose sectionKey equals that key. Groups themselves are sections
 * with parentKey="". Returns null when no groups exist → hardcoded fallback.
 */
export function useScreenGroups(section: string): ScreenGroup[] | null {
  const { contents } = useKioskContent();
  const content = contents.find((c) => c.section === section);
  const rows = content?.sections ?? [];
  if (rows.length === 0) return null;
  const groups = [...rows]
    .filter((s) => !s.parentKey)
    .sort((a, b) => a.order - b.order);
  const result: ScreenGroup[] = groups.map((g) => ({
    key: g.sectionKey,
    title: g.title,
    imageUrl: g.imageUrl,
    order: g.order,
    children: [...rows]
      .filter((s) => s.parentKey === g.sectionKey)
      .sort((a, b) => a.order - b.order)
      .map(toStep),
  }));
  if (!result.some((g) => g.children.length > 0)) return null;
  return result;
}

function toStep(s: { title: string; body: string; imageUrl: string | null; order: number }): ScreenStep {
  return {
    title: s.title,
    lines: s.body
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
    imageUrl: s.imageUrl,
    order: s.order,
  };
}

export function stepText(step: ScreenStep): string {
  return step.lines.length > 0 ? step.lines.join(' ') : step.title;
}

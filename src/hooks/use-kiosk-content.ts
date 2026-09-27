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
 * Admin-managed step list for a screen (ContentSection rows ordered by `order`).
 * - Card-style steps: `title` + `lines` (body split by newline).
 * - Plain string lists: use `text` (= lines joined, or title when body empty).
 * Returns null when no sections exist → screens keep hardcoded fallbacks.
 */
export function useScreenSteps(section: string): ScreenStep[] | null {
  const { contents } = useKioskContent();
  const content = contents.find((c) => c.section === section);
  if (!content || content.sections.length === 0) return null;
  return [...content.sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      title: s.title,
      lines: s.body
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      imageUrl: s.imageUrl,
      order: s.order,
    }));
}

export function stepText(step: ScreenStep): string {
  return step.lines.length > 0 ? step.lines.join(' ') : step.title;
}

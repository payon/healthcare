'use client';

import { useQuery } from '@tanstack/react-query';

export interface AdminStats {
  sessions: {
    total: number;
    today: number;
    week: number;
    completionRate: number;
    avgDurationMs: number;
  };
  content: {
    screens: number;
    measurements: number;
  };
  admin: {
    activeUsers: number;
    activeSessions: number;
  };
  screenVisits: Record<string, number>;
  recentChanges: Array<{
    id: string;
    userId: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
    user: { name: string; email: string } | null;
  }>;
  todayLogs: Record<string, number>;
}

export function useAdminStats(period?: string) {
  const searchParams = new URLSearchParams();
  if (period) searchParams.set('period', period);
  const query = searchParams.toString();

  return useQuery({
    queryKey: ['admin', 'stats', period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('통계를 가져오지 못했습니다');
      const data = await res.json();
      return data as AdminStats;
    },
    refetchInterval: 30 * 1000, // 30s refetch
  });
}

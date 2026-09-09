'use client';

import { useQuery } from '@tanstack/react-query';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  changes: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useAuditLogs(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.userId) searchParams.set('userId', params.userId);
  if (params?.action) searchParams.set('action', params.action);
  if (params?.entity) searchParams.set('entity', params.entity);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  const query = searchParams.toString();

  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit-logs${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('감사 로그를 가져오지 못했습니다');
      const data = await res.json();
      return {
        logs: data.logs as AuditLogEntry[],
        pagination: data.pagination as AuditLogPagination,
      };
    },
  });
}

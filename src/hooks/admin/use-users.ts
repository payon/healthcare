'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUser } from './use-auth';

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useUserList(params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.role) searchParams.set('role', params.role);
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();

  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('사용자 목록을 가져오지 못했습니다');
      const data = await res.json();
      return {
        users: data.users as AdminUser[],
        pagination: data.pagination as UserPagination,
      };
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
      role: 'superadmin' | 'admin' | 'editor' | 'viewer';
    }) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '사용자 생성에 실패했습니다');
      return result.user as AdminUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      email?: string;
      role?: 'superadmin' | 'admin' | 'editor' | 'viewer';
      isActive?: boolean;
      password?: string;
    }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '사용자 수정에 실패했습니다');
      return result.user as AdminUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeleteUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '사용자 비활성화에 실패했습니다');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

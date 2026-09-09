'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['admin', 'auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/admin/auth/me');
      if (!res.ok) {
        throw new Error('인증 정보를 가져오지 못했습니다');
      }
      const data = await res.json();
      // API returns { user: null } when not authenticated (200 status)
      return (data.user as AdminUser | null) ?? null;
    },
    staleTime: 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다');
      }
      return data.user as AdminUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('로그아웃에 실패했습니다');
      return true;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

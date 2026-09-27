'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
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

export interface LoginResult {
  user?: AdminUser;
  need2fa?: boolean;
  challenge?: string;
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
      return data as LoginResult;
    },
    onSuccess: (data) => {
      // Full session only — 2FA challenges must not populate auth cache
      if (data.user && !data.need2fa) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'auth'] });
      }
    },
  });
}

export function useVerify2fa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challenge, token }: { challenge: string; token: string }) => {
      const res = await fetch('/api/admin/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '인증에 실패했습니다');
      }
      return data.user as AdminUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth'] });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data.details
          ? Object.values(data.details as Record<string, string[]>).flat().join(' ')
          : '';
        throw new Error([data.error, details].filter(Boolean).join(' ') || '변경에 실패했습니다');
      }
      return true;
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

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface MeasurementEquipment {
  id: string;
  measurementId: string;
  name: string;
  description: string;
  preparationSteps: string[];
  precautions: string[];
  imageUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementItem {
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
  equipment: MeasurementEquipment[];
}

export function useMeasurementList() {
  return useQuery({
    queryKey: ['admin', 'measurements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/measurements');
      if (!res.ok) throw new Error('측정 항목을 가져오지 못했습니다');
      const data = await res.json();
      return data.measurements as MeasurementItem[];
    },
  });
}

export function useMeasurementDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'measurements', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/measurements/${id}`);
      if (!res.ok) throw new Error('측정 항목을 가져오지 못했습니다');
      const data = await res.json();
      return data.measurement as MeasurementItem;
    },
    enabled: !!id,
  });
}

export function useCreateMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      key: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      order?: number;
      imageUrl?: string | null;
      estimatedTime?: number;
      isActive?: boolean;
    }) => {
      const res = await fetch('/api/admin/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '측정 항목 생성에 실패했습니다');
      return result.measurement as MeasurementItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements'] });
    },
  });
}

export function useUpdateMeasurement(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      key: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      order?: number;
      imageUrl?: string | null;
      estimatedTime?: number;
      isActive?: boolean;
    }) => {
      const res = await fetch(`/api/admin/measurements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '측정 항목 수정에 실패했습니다');
      return result.measurement as MeasurementItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements', id] });
    },
  });
}

export function useDeleteMeasurement(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/measurements/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '측정 항목 삭제에 실패했습니다');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements'] });
    },
  });
}

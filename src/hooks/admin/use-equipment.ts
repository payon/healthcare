'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MeasurementEquipment } from './use-measurements';

export function useEquipmentList(measurementId: string) {
  return useQuery({
    queryKey: ['admin', 'measurements', measurementId, 'equipment'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/measurements/${measurementId}/equipment`);
      if (!res.ok) throw new Error('장비 목록을 가져오지 못했습니다');
      const data = await res.json();
      return data.equipment as MeasurementEquipment[];
    },
    enabled: !!measurementId,
  });
}

export function useCreateEquipment(measurementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      preparationSteps?: string[];
      precautions?: string[];
      imageUrl?: string | null;
      order?: number;
    }) => {
      const res = await fetch(`/api/admin/measurements/${measurementId}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '장비 생성에 실패했습니다');
      return result.equipment as MeasurementEquipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements', measurementId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements', measurementId, 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements'] });
    },
  });
}

export function useUpdateEquipment(measurementId: string, eqId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      preparationSteps?: string[];
      precautions?: string[];
      imageUrl?: string | null;
      order?: number;
    }) => {
      const res = await fetch(`/api/admin/measurements/${measurementId}/equipment/${eqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '장비 수정에 실패했습니다');
      return result.equipment as MeasurementEquipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements', measurementId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements', measurementId, 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements'] });
    },
  });
}

export function useDeleteEquipment(measurementId: string, eqId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/measurements/${measurementId}/equipment/${eqId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '장비 삭제에 실패했습니다');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements', measurementId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements', measurementId, 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'measurements'] });
    },
  });
}

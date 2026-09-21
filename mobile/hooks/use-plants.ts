import api from '@/api';
import useUserStore from '@/state/user';
import { COLORS } from '@/styles/colors';
import { TCareRecord, TCreateCarePlant, TCreatePlant, TPlant, TUpdatePlant, WATER_FREQUENCY_DAYS, WaterStatus } from '@/types/plant';
import { getError } from '@/utils/error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import Toast from 'react-native-toast-message';

/** Вычислить статус полива */
export function getWaterStatus(lastWateredAt: string, frequencyDays: number): WaterStatus {
  const now = new Date();
  const last = new Date(lastWateredAt);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= frequencyDays + 1) return WaterStatus.overdue;
  if (diffDays >= frequencyDays) return WaterStatus.due_today;
  return WaterStatus.ok;
}

/** Сколько дней до следующего полива (отрицательное = просрочено) */
export function daysUntilWater(lastWateredAt: string, frequencyDays: number): number {
  const now = new Date();
  const last = new Date(lastWateredAt);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return frequencyDays - diffDays;
}

export const WATER_STATUS_COLOR: Record<WaterStatus, string> = {
  [WaterStatus.ok]: COLORS.green,
  [WaterStatus.due_today]: COLORS.amber,
  [WaterStatus.overdue]: COLORS.redStrong,
};

export const WATER_STATUS_LABEL: Record<WaterStatus, string> = {
  [WaterStatus.ok]: 'Полив не нужен',
  [WaterStatus.due_today]: 'Полить сегодня',
  [WaterStatus.overdue]: 'Полив просрочен',
};

export function usePlants() {
  const { user } = useUserStore();

  const queryClient = useQueryClient();

  const familyUuid = useMemo(() => user?.family_id ?? "", [user])

  const { data, isPending } = useQuery({
    queryKey: ['getPlants'],
    queryFn: () => api.get('/plant'),
    enabled: !!familyUuid,
  });

  const createPlantMutation = useMutation({
    mutationFn: (data: TCreatePlant) => {
      return api.post('/plant/create', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getPlants'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const updatePlantMutation = useMutation({
    mutationFn: (data: TUpdatePlant) => {
      const { id, ...body } = data
      return api.put(`/plant/${id}`, body);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getPlants'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const putCareHistoryMutation = useMutation({
    mutationFn: (data: TCreateCarePlant) => {
      const { id, ...body } = data
      return api.put(`/plant/${id}/care`, body);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getPlants'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const deletePlantMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/plant/${id}`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getPlants'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const loading = isPending || createPlantMutation.isPending || updatePlantMutation.isPending || putCareHistoryMutation.isPending || deletePlantMutation.isPending

  const add = (data: TCreatePlant) => {
    createPlantMutation.mutate(data)
  };

  const update = (data: TUpdatePlant) => {
    updatePlantMutation.mutate(data)
  };

  const remove = async (id: string) => {
    deletePlantMutation.mutate(id)
  };

  const plants = useMemo<TPlant[]>(() => {
    const result = data?.data ?? []
    result.sort((a: TPlant, b: TPlant) => {
      const dA = daysUntilWater(a.lastWateredAt, WATER_FREQUENCY_DAYS[a.waterFrequency]);
      const dB = daysUntilWater(b.lastWateredAt, WATER_FREQUENCY_DAYS[b.waterFrequency]);
      return dA - dB;
    });
    return result;
  }, [data]);

  const water = async (id: string, note?: string) => {
    putCareHistoryMutation.mutate({id, note})
  };

  const getHistory = (id: string): TCareRecord[] => {
    return plants.find(e => e.id === id)?.careHistory ?? []
  };

  return {
    plants,
    loading,
    familyUuid,
    add,
    update,
    remove,
    water,
    getHistory,
  };
}

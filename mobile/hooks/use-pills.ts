import api from '@/api';
import useUserStore from '@/state/user';
import { COLORS } from '@/styles/colors';
import { PillStatus, TCreatePill, TPill, TUpdatePill } from '@/types/pill';
import { calendarDaysBetween } from '@/utils/date';
import { getError } from '@/utils/error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

/** Вычислить статус лекарства по дате */
export function getPillStatus(expiresAt: string): PillStatus {
  // считаем по календарным дням: в последний день срока лекарство ещё не просрочено
  const diffDays = calendarDaysBetween(new Date(), new Date(expiresAt));

  if (diffDays < 0) return PillStatus.expired;
  if (diffDays <= 30) return PillStatus.expiring_soon;
  return PillStatus.ok;
}

/** Метки статусов */
export const PILL_STATUS_LABEL: Record<PillStatus, string> = {
  [PillStatus.ok]: 'В порядке',
  [PillStatus.expiring_soon]: 'Истекает скоро',
  [PillStatus.expired]: 'Просрочено',
};

/** Цвета статусов */
export const PILL_STATUS_COLOR: Record<PillStatus, string> = {
  [PillStatus.ok]: COLORS.green,
  [PillStatus.expiring_soon]: COLORS.amber,
  [PillStatus.expired]: COLORS.redStrong,
};

export type SortKey = 'expiresAt' | 'name' | 'status';

export function usePills() {
  const { user } = useUserStore();

  const queryClient = useQueryClient();

  const familyUuid = useMemo(() => user?.family_id ?? "", [user])

  const [sortKey, setSortKey] = useState<SortKey>('expiresAt');
  const [filterStatus, setFilterStatus] = useState<PillStatus | 'all'>('all');

  const { data, isPending } = useQuery({
    queryKey: ['getPills'],
    queryFn: () => api.get('/pill'),
    enabled: !!familyUuid,
  });

  const createPillMutation = useMutation({
    mutationFn: (data: TCreatePill) => {
      return api.post('/pill/create', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getPills'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const updatePillMutation = useMutation({
    mutationFn: (data: TUpdatePill) => {
      return api.post('/pill/update', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getPills'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const deletePillMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/pill/${id}`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getPills'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const loading = isPending || createPillMutation.isPending || updatePillMutation.isPending || deletePillMutation.isPending

  const add = (data: TCreatePill) => {
    createPillMutation.mutate(data)
  };

  const update = (id: string, data: TCreatePill) => {
    updatePillMutation.mutate({
      ...data,
      id,
    })
  };

  const remove = async (id: string) => {
    deletePillMutation.mutate(id)
  };

  const pills = useMemo<TPill[]>(() => data?.data ?? [], [data]);

  const processedPills = useMemo<TPill[]>(
    () => pills
      .filter((p) => filterStatus === 'all' || getPillStatus(p.expiresAt) === filterStatus)
      .sort((a, b) => {
        if (sortKey === 'name') return a.name.localeCompare(b.name);
        if (sortKey === 'status') {
          const order = [PillStatus.expired, PillStatus.expiring_soon, PillStatus.ok];
          return order.indexOf(getPillStatus(a.expiresAt)) - order.indexOf(getPillStatus(b.expiresAt));
        }
        // expiresAt — по умолчанию
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }),
    [pills, filterStatus, sortKey]
  );

  return {
    pills: processedPills,
    loading,
    familyUuid,
    sortKey,
    setSortKey,
    filterStatus,
    setFilterStatus,
    add,
    update,
    remove,
  };
}

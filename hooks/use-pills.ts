import { useCallback, useEffect, useState } from 'react';
import { TPill, TCreatePill, PillStatus } from '@/types/pill';
import { getPills, addPill, updatePill, deletePill } from '@/utils/pills-store';
import { getDocument } from '@/utils/firebase-store';
import useUserStore from '@/state/user';

/** Вычислить статус лекарства по дате */
export function getPillStatus(expiresAt: string): PillStatus {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
  [PillStatus.ok]: '#4CAF50',
  [PillStatus.expiring_soon]: '#FF9800',
  [PillStatus.expired]: '#F44336',
};

export type SortKey = 'expiresAt' | 'name' | 'status';

export function usePills() {
  const { user } = useUserStore((s) => s);
  const [pills, setPills] = useState<TPill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [familyUuid, setFamilyUuid] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('expiresAt');
  const [filterStatus, setFilterStatus] = useState<PillStatus | 'all'>('all');

  // Получаем familyUuid из профиля пользователя
  useEffect(() => {
    if (!user?.uid) return;
    getDocument('users', user.uid).then((data) => {
      if (data?.family_uuid) setFamilyUuid(data.family_uuid);
    });
  }, [user?.uid]);

  // Загружаем лекарства
  const load = useCallback(async () => {
    if (!familyUuid) {
      console.log('familyUuid is null, skip load');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('loading pills for family:', familyUuid);
      const data = await getPills(familyUuid);
      console.log('loaded pills:', data);
      setPills(data);
    } catch (e) {
      console.log('error loading pills:', e);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [familyUuid]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (data: TCreatePill) => {
    if (!familyUuid || !user?.uid) return;
    await addPill(data, familyUuid, user.uid);
    await load();
  };

  const update = async (id: string, data: Partial<TCreatePill>) => {
    await updatePill(id, data);
    await load();
  };

  const remove = async (id: string) => {
    await deletePill(id);
    await load();
  };

  const processedPills = pills
    .filter((p) => filterStatus === 'all' || getPillStatus(p.expiresAt) === filterStatus)
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'status') {
        const order = [PillStatus.expired, PillStatus.expiring_soon, PillStatus.ok];
        return order.indexOf(getPillStatus(a.expiresAt)) - order.indexOf(getPillStatus(b.expiresAt));
      }
      // expiresAt — по умолчанию
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });

  return {
    pills: processedPills,
    loading,
    error,
    familyUuid,
    sortKey,
    setSortKey,
    filterStatus,
    setFilterStatus,
    add,
    update,
    remove,
    reload: load,
  };
}

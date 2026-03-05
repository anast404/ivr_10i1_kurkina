import { useCallback, useEffect, useState } from 'react';
import { TPlant, TCreatePlant, WaterStatus, WATER_FREQUENCY_DAYS } from '@/types/plant';
import { getPlants, addPlant, updatePlant, deletePlant, waterPlant, getCareRecords } from '@/utils/plants-store';
import { getDocument } from '@/utils/firebase-store';
import useUserStore from '@/state/user';
import { TCareRecord } from '@/types/plant';

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
  [WaterStatus.ok]: '#4CAF50',
  [WaterStatus.due_today]: '#FF9800',
  [WaterStatus.overdue]: '#F44336',
};

export const WATER_STATUS_LABEL: Record<WaterStatus, string> = {
  [WaterStatus.ok]: 'Полив не нужен',
  [WaterStatus.due_today]: 'Полить сегодня',
  [WaterStatus.overdue]: 'Полив просрочен',
};

export function usePlants() {
  const { user } = useUserStore((s) => s);
  const [plants, setPlants] = useState<TPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [familyUuid, setFamilyUuid] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getDocument('users', user.uid).then((data) => {
      if (data?.family_uuid) setFamilyUuid(data.family_uuid);
    });
  }, [user?.uid]);

  const load = useCallback(async () => {
    if (!familyUuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlants(familyUuid);
      // сортировка: сначала те кому нужен полив
      data.sort((a, b) => {
        const dA = daysUntilWater(a.lastWateredAt, WATER_FREQUENCY_DAYS[a.waterFrequency]);
        const dB = daysUntilWater(b.lastWateredAt, WATER_FREQUENCY_DAYS[b.waterFrequency]);
        return dA - dB;
      });
      setPlants(data);
    } catch (e) {
      console.log('error loading plants:', e);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [familyUuid]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (data: TCreatePlant) => {
    if (!familyUuid || !user?.uid) return;
    await addPlant(data, familyUuid, user.uid);
    await load();
  };

  const update = async (id: string, data: Partial<TCreatePlant>) => {
    await updatePlant(id, data);
    await load();
  };

  const remove = async (id: string) => {
    await deletePlant(id);
    await load();
  };

  const water = async (plantId: string, note?: string) => {
    if (!familyUuid) return;
    await waterPlant(plantId, familyUuid, note);
    await load();
  };

  const getHistory = async (plantId: string): Promise<TCareRecord[]> => {
    return getCareRecords(plantId);
  };

  return {
    plants,
    loading,
    error,
    familyUuid,
    add,
    update,
    remove,
    water,
    getHistory,
    reload: load,
  };
}

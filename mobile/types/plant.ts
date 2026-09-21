/** Частота полива */
export enum WaterFrequency {
  daily = 'daily',
  every_2_days = 'every_2_days',
  every_3_days = 'every_3_days',
  weekly = 'weekly',
  every_2_weeks = 'every_2_weeks',
  monthly = 'monthly',
}

export const WATER_FREQUENCY_LABEL: Record<WaterFrequency, string> = {
  [WaterFrequency.daily]: 'Каждый день',
  [WaterFrequency.every_2_days]: 'Каждые 2 дня',
  [WaterFrequency.every_3_days]: 'Каждые 3 дня',
  [WaterFrequency.weekly]: 'Раз в неделю',
  [WaterFrequency.every_2_weeks]: 'Раз в 2 недели',
  [WaterFrequency.monthly]: 'Раз в месяц',
};

/** Интервал полива в днях */
export const WATER_FREQUENCY_DAYS: Record<WaterFrequency, number> = {
  [WaterFrequency.daily]: 1,
  [WaterFrequency.every_2_days]: 2,
  [WaterFrequency.every_3_days]: 3,
  [WaterFrequency.weekly]: 7,
  [WaterFrequency.every_2_weeks]: 14,
  [WaterFrequency.monthly]: 30,
};

/** Статус полива */
export enum WaterStatus {
  ok = 'ok',           // поливать не нужно
  due_today = 'due_today',   // нужно полить сегодня
  overdue = 'overdue',       // полив просрочен
}

/** Тип растения */
export type TPlant = {
  id: string;
  name: string;
  description?: string;       // особенности ухода
  waterFrequency: WaterFrequency;
  lastWateredAt: string;      // ISO-строка последнего полива
  createdAt: string;
  createdBy: string;
  familyUuid: string;
};

/** Тип для создания нового растения */
export type TCreatePlant = Omit<TPlant, 'id' | 'createdAt' | 'createdBy' | 'familyUuid'>;

/** Запись в истории ухода */
export type TCareRecord = {
  id: string;
  plantId: string;
  date: string;       // ISO-строка
  note?: string;
  familyUuid: string;
};

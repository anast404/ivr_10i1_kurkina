/** Статус лекарства */
export enum PillStatus {
  ok = 'ok',
  expiring_soon = 'expiring_soon', // истекает в течение 30 дней
  expired = 'expired',             // просрочено
}

/** Тип лекарства */
export type TPill = {
  id: string;
  name: string;
  description?: string;       // назначение / для чего
  expiresAt: string;          // ISO-строка даты окончания срока годности
  quantity?: number;          // количество
  createdAt: string;          // ISO-строка даты добавления
  createdBy: string;          // uid пользователя
  familyUuid: string;         // идентификатор семьи
};

/** Тип для создания нового лекарства (без id и служебных полей) */
export type TCreatePill = Omit<TPill, 'id' | 'createdAt' | 'createdBy' | 'familyUuid'>;

export type TUpdatePill = Omit<TPill, 'createdAt' | 'createdBy' | 'familyUuid'>;

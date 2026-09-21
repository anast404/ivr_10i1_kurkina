/** Периодичность добавления товара в список */
export enum ShoppingFrequency {
  once        = 'once',         // только один раз (без повтора)
  weekly      = 'weekly',       // раз в неделю
  every_2_weeks = 'every_2_weeks',
  monthly     = 'monthly',      // раз в месяц
}

export const SHOPPING_FREQUENCY_LABEL: Record<ShoppingFrequency, string> = {
  [ShoppingFrequency.once]:          'Однократно',
  [ShoppingFrequency.weekly]:        'Раз в неделю',
  [ShoppingFrequency.every_2_weeks]: 'Раз в 2 недели',
  [ShoppingFrequency.monthly]:       'Раз в месяц',
};

export const SHOPPING_FREQUENCY_DAYS: Record<ShoppingFrequency, number | null> = {
  [ShoppingFrequency.once]:          null,
  [ShoppingFrequency.weekly]:        7,
  [ShoppingFrequency.every_2_weeks]: 14,
  [ShoppingFrequency.monthly]:       30,
};

/** Статус товара */
export enum ShoppingItemStatus {
  pending  = 'pending',   // нужно купить
  bought   = 'bought',    // куплено
  overdue  = 'overdue',   // дата закупки прошла, не куплено
}

/** Тип товара */
export type TShoppingItem = {
  id: string;
  name: string;
  category?: string;        // категория (молочное, овощи и т.д.)
  quantity?: string;        // количество ("2 кг", "1 упаковка")
  buyByDate?: string;       // ISO — желаемая дата закупки
  frequency: ShoppingFrequency;
  bought: boolean;
  boughtAt?: string;        // ISO — когда куплено
  createdAt: string;
  createdBy: string;
  familyUuid: string;
};

export type TCreateShoppingItem = Omit<TShoppingItem, 'id' | 'createdAt' | 'createdBy' | 'familyUuid' | 'bought' | 'boughtAt'>;

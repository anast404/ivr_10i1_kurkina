export enum ShoppingFrequency {
  once        = 'once',         // только один раз (без повтора)
  weekly      = 'weekly',       // раз в неделю
  every_2_weeks = 'every_2_weeks',
  monthly     = 'monthly',      // раз в месяц
}

/** Через сколько дней создаётся следующая покупка после отметки «куплено» */
export const SHOPPING_FREQUENCY_DAYS: Record<ShoppingFrequency, number | null> = {
  [ShoppingFrequency.once]: null,
  [ShoppingFrequency.weekly]: 7,
  [ShoppingFrequency.every_2_weeks]: 14,
  [ShoppingFrequency.monthly]: 30,
};

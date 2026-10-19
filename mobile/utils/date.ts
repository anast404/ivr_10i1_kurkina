/**
 * Разбор даты формата ДД.ММ.ГГГГ (допускает 1.2.2027) в ISO-строку.
 * Возвращает '' для некорректной даты. Берём полдень UTC, чтобы часовой пояс
 * не сдвигал день при отображении.
 */
export function parseDate(str: string): string {
  const m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(str);
  if (!m) return '';
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const same =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return same ? date.toISOString() : '';
}

/** Начало календарных суток в локальном часовом поясе */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Сколько календарных дней от from до to (отрицательное, если to раньше) */
export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

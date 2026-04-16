/**
 * Общие утилиты валидации форм
 */

// ─── Типы ────────────────────────────────────────────────────────────────────

export type ValidationErrors = Record<string, string>;

export type ValidationRule<T> = {
  field: keyof T & string;
  required?: boolean;
  requiredMessage?: string;
  validate?: (value: string) => string | null; // null = OK, строка = сообщение об ошибке
};

// ─── Базовые валидаторы ──────────────────────────────────────────────────────

/** Проверить обязательное текстовое поле */
export function validateRequired(value: string, message = 'Поле обязательно'): string | null {
  return value.trim() ? null : message;
}

/** Проверить email */
export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Введите email';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value.trim()) ? null : 'Введите корректный email';
}

/** Проверить пароль */
export function validatePassword(value: string, minLength = 6): string | null {
  if (!value.trim()) return 'Введите пароль';
  if (value.length < minLength) return `Минимум ${minLength} символов`;
  return null;
}

/** Проверить дату формата ДД.ММ.ГГГГ */
export function validateDateString(value: string, required = false): string | null {
  if (!value.trim()) {
    return required ? 'Введите дату' : null;
  }
  const parts = value.split('.');
  if (parts.length !== 3) return 'Формат: ДД.ММ.ГГГГ';
  const [d, m, y] = parts;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? 'Формат: ДД.ММ.ГГГГ' : null;
}

// ─── Запуск набора правил ────────────────────────────────────────────────────

/**
 * Выполняет набор правил и возвращает объект ошибок.
 * Если объект пустой — валидация прошла успешно.
 */
export function runValidation<T extends Record<string, string>>(
  values: T,
  rules: ValidationRule<T>[],
): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const rule of rules) {
    const raw = values[rule.field] ?? '';

    if (rule.required) {
      const err = validateRequired(raw, rule.requiredMessage ?? 'Поле обязательно');
      if (err) { errors[rule.field] = err; continue; }
    }

    if (rule.validate) {
      const err = rule.validate(raw);
      if (err) { errors[rule.field] = err; }
    }
  }

  return errors;
}

export function isValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}

// ─── Готовые наборы правил ───────────────────────────────────────────────────

export const loginValidationRules: ValidationRule<{ email: string; password: string }>[] = [
  { field: 'email',    validate: validateEmail },
  { field: 'password', validate: validatePassword },
];

export const pillValidationRules: ValidationRule<{ name: string; dateInput: string }>[] = [
  { field: 'name',      required: true, requiredMessage: 'Введите название' },
  { field: 'dateInput', validate: (v) => validateDateString(v, true) },
];

export const shoppingValidationRules: ValidationRule<{ name: string; dateStr: string }>[] = [
  { field: 'name',    required: true, requiredMessage: 'Введите название' },
  { field: 'dateStr', validate: (v) => validateDateString(v, false) },
];

export const plantValidationRules: ValidationRule<{ name: string }>[] = [
  { field: 'name', required: true, requiredMessage: 'Введите название' },
];

export const familyCreateRules: ValidationRule<{ name: string }>[] = [
  { field: 'name', required: true, requiredMessage: 'Введите название семьи' },
];

export const familyJoinRules: ValidationRule<{ uuid: string }>[] = [
  { field: 'uuid', required: true, requiredMessage: 'Введите идентификатор' },
];

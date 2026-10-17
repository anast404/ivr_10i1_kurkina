import { HttpError } from "@/utils/http-error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmail(value: unknown): string {
  if (typeof value !== "string" || value.length > 254 || !EMAIL_RE.test(value.trim())) {
    throw new HttpError(400, "Введите корректный email");
  }
  return value.trim().toLowerCase();
}

export function parsePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 6) {
    throw new HttpError(400, "Пароль должен содержать минимум 6 символов");
  }
  if (value.length > 128) {
    throw new HttpError(400, "Пароль слишком длинный");
  }
  return value;
}

/** Обязательная непустая строка */
export function requiredText(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `Поле «${label}» обязательно`);
  }
  const text = value.trim();
  if (text.length > max) {
    throw new HttpError(400, `Поле «${label}» длиннее ${max} символов`);
  }
  return text;
}

/** Необязательная строка: пустое значение превращается в undefined */
export function optionalText(value: unknown, label: string, max = 500): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, `Поле «${label}» должно быть строкой`);
  }
  const text = value.trim();
  if (text.length > max) {
    throw new HttpError(400, `Поле «${label}» длиннее ${max} символов`);
  }
  return text || undefined;
}

export function optionalNumber(value: unknown, label: string, min = 0): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    throw new HttpError(400, `Поле «${label}» должно быть числом не меньше ${min}`);
  }
  return value;
}

export function parseDate(value: unknown, label: string): Date {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new HttpError(400, `Поле «${label}» обязательно`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `Поле «${label}» содержит некорректную дату`);
  }
  return date;
}

export function optionalDate(value: unknown, label: string): Date | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return parseDate(value, label);
}

export function parseEnum<T extends string>(value: unknown, label: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new HttpError(400, `Поле «${label}» должно быть одним из: ${allowed.join(", ")}`);
  }
  return value as T;
}

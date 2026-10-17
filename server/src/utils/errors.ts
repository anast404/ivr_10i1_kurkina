import { HttpError } from "@/utils/http-error";
import mongoose from "mongoose";

export { HttpError };

/** Приводит любую ошибку к HttpError. Внутренние детали (500) клиенту не раскрываем. */
export function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) {
    return err;
  }
  if (err instanceof mongoose.Error.CastError) {
    return new HttpError(400, "Некорректный идентификатор");
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return new HttpError(400, "Некорректные данные: " + Object.keys(err.errors).join(", "));
  }
  // нарушение уникального индекса (например, e-mail уже занят)
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    return new HttpError(400, "Такая запись уже существует");
  }
  console.error(err);
  return new HttpError(500, "Внутренняя ошибка сервера");
}

import "./env";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HttpError } from "../src/utils/http-error";
import {
  optionalDate,
  optionalNumber,
  optionalText,
  parseDate,
  parseEmail,
  parseEnum,
  parsePassword,
  requiredText,
} from "../src/utils/validation";

const badRequest = (status = 400) => (err: unknown) => err instanceof HttpError && err.status === status;

describe("validation", () => {
  it("parseEmail нормализует адрес и отклоняет мусор", () => {
    assert.equal(parseEmail("  User@Example.COM "), "user@example.com");
    assert.throws(() => parseEmail("not-an-email"), badRequest());
    assert.throws(() => parseEmail(undefined), badRequest());
    assert.throws(() => parseEmail({ $gt: "" }), badRequest());
  });

  it("parsePassword требует минимум 6 символов", () => {
    assert.equal(parsePassword("123456"), "123456");
    assert.throws(() => parsePassword("12345"), badRequest());
    assert.throws(() => parsePassword(123456), badRequest());
  });

  it("requiredText обрезает пробелы и проверяет длину", () => {
    assert.equal(requiredText("  Аспирин ", "Название"), "Аспирин");
    assert.throws(() => requiredText("   ", "Название"), badRequest());
    assert.throws(() => requiredText("x".repeat(11), "Название", 10), badRequest());
  });

  it("optionalText превращает пустое значение в undefined", () => {
    assert.equal(optionalText(undefined, "Описание"), undefined);
    assert.equal(optionalText("  ", "Описание"), undefined);
    assert.equal(optionalText(" текст ", "Описание"), "текст");
    assert.throws(() => optionalText(5, "Описание"), badRequest());
  });

  it("optionalNumber принимает только неотрицательные числа", () => {
    assert.equal(optionalNumber(undefined, "Количество"), undefined);
    assert.equal(optionalNumber(2.5, "Количество"), 2.5);
    assert.throws(() => optionalNumber(-1, "Количество"), badRequest());
    assert.throws(() => optionalNumber("5", "Количество"), badRequest());
  });

  it("parseDate принимает ISO-строку и отклоняет некорректную дату", () => {
    assert.equal(parseDate("2027-02-01T12:00:00.000Z", "Дата").toISOString(), "2027-02-01T12:00:00.000Z");
    assert.throws(() => parseDate("не дата", "Дата"), badRequest());
    assert.throws(() => parseDate(undefined, "Дата"), badRequest());
    assert.equal(optionalDate("", "Дата"), undefined);
  });

  it("parseEnum пропускает только допустимые значения", () => {
    const allowed = ["daily", "weekly"] as const;
    assert.equal(parseEnum("daily", "Частота", allowed), "daily");
    assert.throws(() => parseEnum("yearly", "Частота", allowed), badRequest());
  });
});

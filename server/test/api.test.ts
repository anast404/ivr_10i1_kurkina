import "./env";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import User from "../src/models/User";
import { testOutbox } from "../src/services/mailer";
import { request, startServer, TestServer } from "./helpers";

let server: TestServer;

const api = (method: string, path: string, options: { token?: string; body?: unknown } = {}) =>
  request(server.baseUrl, method, path, options);

/** Регистрирует пользователя, открывает ссылку из письма и возвращает токен */
async function registerVerified(email: string, password = "secret123"): Promise<string> {
  const res = await api("POST", "/auth/register", { body: { email, password } });
  assert.equal(res.status, 201);

  const mail = testOutbox.filter((m) => m.to === email).pop();
  assert.ok(mail, "письмо с ссылкой должно быть отправлено");
  const verify = await fetch(`${server.origin}${new URL(mail.url).pathname}`);
  assert.equal(verify.status, 200);

  return res.json.token as string;
}

describe("API", () => {
  before(async () => {
    server = await startServer();
  });

  after(async () => {
    await server.close();
  });

  describe("авторизация и подтверждение почты", () => {
    it("регистрация выдаёт токен, неподтверждённый пользователь видит профиль, но не данные", async () => {
      const res = await api("POST", "/auth/register", { body: { email: "New@Example.com", password: "secret123" } });
      assert.equal(res.status, 201);
      assert.equal(res.json.mailSent, true);

      const profile = await api("GET", "/user", { token: res.json.token });
      assert.equal(profile.status, 200);
      assert.equal(profile.json.email, "new@example.com");
      assert.equal(profile.json.isVerified, false);

      const pills = await api("GET", "/pill", { token: res.json.token });
      assert.equal(pills.status, 403);
    });

    it("отклоняет повторную регистрацию, слабый пароль и неверный email", async () => {
      await api("POST", "/auth/register", { body: { email: "dup@example.com", password: "secret123" } });
      assert.equal((await api("POST", "/auth/register", { body: { email: "dup@example.com", password: "secret123" } })).status, 400);
      assert.equal((await api("POST", "/auth/register", { body: { email: "x@example.com", password: "123" } })).status, 400);
      assert.equal((await api("POST", "/auth/register", { body: { email: "oops", password: "secret123" } })).status, 400);
    });

    it("ссылка из письма подтверждает почту, повторный переход недействителен", async () => {
      const token = await registerVerified("verify@example.com");
      const profile = await api("GET", "/user", { token });
      assert.equal(profile.json.isVerified, true);

      const mail = testOutbox.filter((m) => m.to === "verify@example.com").pop()!;
      const again = await fetch(`${server.origin}${new URL(mail.url).pathname}`);
      assert.equal(again.status, 400);
    });

    it("повторная отправка письма ограничена по частоте", async () => {
      const res = await api("POST", "/auth/register", { body: { email: "resend@example.com", password: "secret123" } });
      const first = await api("POST", "/auth/resend", { token: res.json.token });
      assert.equal(first.status, 429, "сразу после регистрации письмо уже отправлено");

      await User.updateOne({ email: "resend@example.com" }, { verificationSentAt: new Date(Date.now() - 61_000) });
      const second = await api("POST", "/auth/resend", { token: res.json.token });
      assert.equal(second.status, 200);
    });

    it("вход: верный пароль — токен, неверный — 401", async () => {
      await registerVerified("login@example.com");
      const ok = await api("POST", "/auth/login", { body: { email: "login@example.com", password: "secret123" } });
      assert.equal(ok.status, 200);
      assert.ok(ok.json.token);

      const bad = await api("POST", "/auth/login", { body: { email: "login@example.com", password: "wrong-pass" } });
      assert.equal(bad.status, 401);
    });

    it("без токена и с неверным токеном доступ закрыт", async () => {
      assert.equal((await api("GET", "/pill")).status, 401);
      assert.equal((await api("GET", "/pill", { token: "garbage" })).status, 401);
    });
  });

  describe("семья и данные", () => {
    it("без семьи данные недоступны (400 с понятным сообщением)", async () => {
      const token = await registerVerified("nofamily@example.com");
      const res = await api("GET", "/pill", { token });
      assert.equal(res.status, 400);
      assert.match(res.json.message, /семью/);
    });

    it("лекарства: создание, валидация, обновление и удаление", async () => {
      const token = await registerVerified("pills@example.com");
      await api("POST", "/family/create", { token, body: { name: "Пилюлины" } });

      const invalid = await api("POST", "/pill/create", { token, body: { name: "", expiresAt: "2027-01-01" } });
      assert.equal(invalid.status, 400);
      const badDate = await api("POST", "/pill/create", { token, body: { name: "Аспирин", expiresAt: "вчера" } });
      assert.equal(badDate.status, 400);

      const created = await api("POST", "/pill/create", {
        token,
        body: { name: "Аспирин", description: "От головы", quantity: 10, expiresAt: "2027-01-01T12:00:00.000Z" },
      });
      assert.equal(created.status, 200);

      const list = await api("GET", "/pill", { token });
      assert.equal(list.json.length, 1);
      const pill = list.json[0];
      assert.equal(pill.name, "Аспирин");
      assert.ok(pill.id, "в ответе должен быть id");

      const updated = await api("POST", "/pill/update", {
        token,
        body: { id: pill.id, name: "Нурофен", quantity: 5, expiresAt: "2027-06-01T12:00:00.000Z" },
      });
      assert.equal(updated.status, 200);
      assert.equal((await api("GET", "/pill", { token })).json[0].name, "Нурофен");

      assert.equal((await api("DELETE", `/pill/${pill.id}`, { token })).status, 200);
      assert.equal((await api("DELETE", `/pill/${pill.id}`, { token })).status, 404);
      assert.equal((await api("DELETE", "/pill/not-an-id", { token })).status, 400);
    });

    it("чужая семья не видит и не может менять данные", async () => {
      const owner = await registerVerified("owner@example.com");
      const stranger = await registerVerified("stranger@example.com");
      const familyRes = await api("POST", "/family/create", { token: owner, body: { name: "Семья А" } });
      await api("POST", "/family/create", { token: stranger, body: { name: "Семья Б" } });

      await api("POST", "/pill/create", { token: owner, body: { name: "Секрет", expiresAt: "2027-01-01T12:00:00.000Z" } });
      const pillId = (await api("GET", "/pill", { token: owner })).json[0].id;

      assert.equal((await api("GET", "/pill", { token: stranger })).json.length, 0);
      assert.equal((await api("DELETE", `/pill/${pillId}`, { token: stranger })).status, 404);
      assert.equal(
        (await api("POST", "/pill/update", { token: stranger, body: { id: pillId, name: "Взлом", expiresAt: "2027-01-01T12:00:00.000Z" } })).status,
        404
      );
      assert.equal((await api("GET", `/family?id=${familyRes.json.family_id}`, { token: stranger })).status, 403);
      assert.equal((await api("GET", "/pill", { token: owner })).json[0].name, "Секрет");
    });

    it("растения: полив обновляет lastWateredAt и историю", async () => {
      const token = await registerVerified("plants@example.com");
      await api("POST", "/family/create", { token, body: { name: "Садоводы" } });

      const bad = await api("POST", "/plant/create", {
        token,
        body: { name: "Фикус", waterFrequency: "hourly", lastWateredAt: "2026-01-01T00:00:00.000Z" },
      });
      assert.equal(bad.status, 400);

      await api("POST", "/plant/create", {
        token,
        body: { name: "Фикус", waterFrequency: "weekly", lastWateredAt: "2026-01-01T00:00:00.000Z" },
      });
      const plantBefore = (await api("GET", "/plant", { token })).json[0];

      const watered = await api("PUT", `/plant/${plantBefore.id}/care`, { token, body: { note: "утром" } });
      assert.equal(watered.status, 200);

      const plantAfter = (await api("GET", "/plant", { token })).json[0];
      assert.ok(new Date(plantAfter.lastWateredAt).getTime() > new Date(plantBefore.lastWateredAt).getTime());
      assert.equal(plantAfter.careHistory.length, plantBefore.careHistory.length + 1);
      assert.equal(plantAfter.careHistory[plantAfter.careHistory.length - 1].note, "утром");
    });

    it("покупки: «куплено» создаёт следующую повторяющуюся покупку ровно один раз", async () => {
      const token = await registerVerified("shop@example.com");
      await api("POST", "/family/create", { token, body: { name: "Покупатели" } });

      await api("POST", "/shopping/create", { token, body: { name: "Молоко", frequency: "weekly", buyByDate: "2026-12-01T12:00:00.000Z" } });
      await api("POST", "/shopping/create", { token, body: { name: "Соль", frequency: "once" } });
      assert.equal((await api("POST", "/shopping/create", { token, body: { name: "Хлеб", frequency: "daily" } })).status, 400);

      const items = (await api("GET", "/shopping", { token })).json as { id: string; name: string }[];
      const milk = items.find((i) => i.name === "Молоко")!;
      const salt = items.find((i) => i.name === "Соль")!;

      assert.equal((await api("PUT", `/shopping/${milk.id}/bought`, { token, body: { bought: true } })).status, 200);
      assert.equal((await api("PUT", `/shopping/${milk.id}/bought`, { token, body: { bought: true } })).status, 200);
      assert.equal((await api("PUT", `/shopping/${salt.id}/bought`, { token, body: { bought: true } })).status, 200);
      assert.equal((await api("PUT", `/shopping/${salt.id}/bought`, { token, body: { bought: "yes" } })).status, 400);

      const shoppings = (await api("GET", "/shopping", { token })).json as { name: string; bought?: boolean }[];
      assert.equal(shoppings.filter((i) => i.name === "Молоко").length, 2, "должна появиться ровно одна следующая покупка");
      assert.equal(shoppings.filter((i) => i.name === "Соль").length, 1, "разовая покупка не повторяется");
    });

    it("покупки: два одновременных запроса «куплено» не создают дубликат", async () => {
      const token = await registerVerified("race@example.com");
      await api("POST", "/family/create", { token, body: { name: "Гонка" } });
      await api("POST", "/shopping/create", { token, body: { name: "Кефир", frequency: "weekly" } });
      const kefir = ((await api("GET", "/shopping", { token })).json as { id: string }[])[0];

      const results = await Promise.all([1, 2, 3].map(() => api("PUT", `/shopping/${kefir.id}/bought`, { token, body: { bought: true } })));
      assert.ok(results.every((r) => r.status === 200));

      const shoppings = (await api("GET", "/shopping", { token })).json as unknown[];
      assert.equal(shoppings.length, 2, "оригинал и ровно одна следующая покупка");
    });

    it("семья: участники, передача владения и очистка данных при выходе последнего", async () => {
      const first = await registerVerified("fam1@example.com");
      const second = await registerVerified("fam2@example.com");

      const created = await api("POST", "/family/create", { token: first, body: { name: "Семья" } });
      assert.equal((await api("POST", "/family/create", { token: first, body: { name: "Ещё одна" } })).status, 400);
      await api("POST", "/pill/create", { token: first, body: { name: "Общее", expiresAt: "2027-01-01T12:00:00.000Z" } });

      assert.equal((await api("PUT", "/user/update", { token: second, body: { family_id: "not-an-id" } })).status, 400);
      assert.equal((await api("PUT", "/user/update", { token: second, body: { family_id: created.json.family_id } })).status, 200);
      assert.equal((await api("GET", "/pill", { token: second })).json.length, 1, "данные общие для семьи");

      const members = (await api("GET", "/family/members", { token: second })).json as { email: string; isOwner: boolean }[];
      assert.equal(members.length, 2);
      assert.equal(members.find((m) => m.email === "fam1@example.com")?.isOwner, true);

      await api("DELETE", "/user/leave-family", { token: first });
      const afterOwnerLeft = (await api("GET", "/family/members", { token: second })).json as { email: string; isOwner: boolean }[];
      assert.equal(afterOwnerLeft.length, 1);
      assert.equal(afterOwnerLeft[0].isOwner, true, "владение перешло оставшемуся участнику");

      await api("DELETE", "/user/leave-family", { token: second });
      const rejoin = await api("PUT", "/user/update", { token: second, body: { family_id: created.json.family_id } });
      assert.equal(rejoin.status, 404, "пустая семья удалена вместе с данными");
    });
  });

  describe("служебное", () => {
    it("health-check, 404 и некорректный JSON", async () => {
      assert.equal((await api("GET", "/health")).json.status, "ok");
      assert.equal((await api("GET", "/unknown")).status, 404);

      const res = await fetch(`${server.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{broken",
      });
      assert.equal(res.status, 400);
    });
  });
});

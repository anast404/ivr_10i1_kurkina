import "./env";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maskMongoUri } from "../src/utils/mongo-uri";

describe("maskMongoUri", () => {
  it("скрывает пароль в обычной и в srv-строке подключения", () => {
    assert.equal(
      maskMongoUri("mongodb://happyhome:secret@db:27017/happyhome?authSource=admin"),
      "mongodb://happyhome:***@db:27017/happyhome?authSource=admin"
    );
    assert.equal(
      maskMongoUri("mongodb+srv://user:p%40ss@cluster0.abc.mongodb.net/happyhome"),
      "mongodb+srv://user:***@cluster0.abc.mongodb.net/happyhome"
    );
  });

  it("не меняет строку без учётных данных", () => {
    assert.equal(maskMongoUri("mongodb://localhost:27017/happyhome"), "mongodb://localhost:27017/happyhome");
  });
});

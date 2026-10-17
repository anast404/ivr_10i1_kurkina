import "./env";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateLimit } from "../src/middleware/rateLimit";

function call(limiter: ReturnType<typeof rateLimit>, ip: string) {
  const result = { status: 200, passed: false };
  const res = {
    setHeader() {},
    status(code: number) {
      result.status = code;
      return res;
    },
    json() {
      return res;
    },
  };
  limiter({ ip } as never, res as never, () => {
    result.passed = true;
  });
  return result;
}

describe("rateLimit", () => {
  it("пропускает запросы до лимита и отвечает 429 после него", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    assert.equal(call(limiter, "1.1.1.1").passed, true);
    assert.equal(call(limiter, "1.1.1.1").passed, true);

    const blocked = call(limiter, "1.1.1.1");
    assert.equal(blocked.passed, false);
    assert.equal(blocked.status, 429);
  });

  it("считает запросы отдельно для каждого IP", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    assert.equal(call(limiter, "1.1.1.1").passed, true);
    assert.equal(call(limiter, "2.2.2.2").passed, true);
    assert.equal(call(limiter, "1.1.1.1").passed, false);
  });
});

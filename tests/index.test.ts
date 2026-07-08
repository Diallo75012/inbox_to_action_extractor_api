import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

type MockEnv = {
  RAPIDAPI_PROXY_SECRET: string;
  AI_ENABLED: string;
  AI: { calls: string[]; run(model: string): Promise<{ response: string }> };
  CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API: {
    writes: string[];
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  };
  legacyUsageStore: {
    writes: string[];
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
  };
};

function makeEnv(): MockEnv {
  const usageStore = new Map<string, string>();
  const cacheStore = new Map<string, string>();
  return {
    RAPIDAPI_PROXY_SECRET: "secret",
    AI_ENABLED: "true",
    AI: {
      calls: [],
      async run(model: string) {
        this.calls.push(model);
        if (model.includes("qwen")) throw new Error("fail primary");
        return { response: "Review tasks, dates, and the reply draft before acting." };
      }
    },
    CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API: {
      writes: [],
      async get(key: string) {
        return cacheStore.get(key) ?? null;
      },
      async put(key: string, value: string) {
        this.writes.push(`${key}:${value}`);
        cacheStore.set(key, value);
      }
    },
    legacyUsageStore: {
      writes: [],
      async get(key: string) {
        return usageStore.get(key) ?? null;
      },
      async put(key: string, value: string) {
        this.writes.push(`${key}:${value}`);
        usageStore.set(key, value);
      }
    }
  };
}
function req(path: string, init: RequestInit = {}) {
  return new Request(`https://example.com${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Proxy-Secret": "secret",
      "X-RapidAPI-User": "u1",
      ...(init.headers ?? {})
    }
  });
}

test("POST /v1/inbox-to-action rejects direct origin calls", async () => {
  const env = makeEnv();
  const res = await worker.fetch(new Request("https://example.com/v1/inbox-to-action", { method: "POST" }), env);

  assert.equal(res.status, 403);
  assert.equal(env.legacyUsageStore.writes.length, 0);
});

test("POST /v1/inbox-to-action returns stable JSON, does not count usage, and uses AI fallback", async () => {
  const env = makeEnv();
  const res = await worker.fetch(
    req("/v1/inbox-to-action", {
      method: "POST",
      body: JSON.stringify({
        subject: "Customer launch",
        email: "Hi team, please review the launch plan by 08/15/2026. Can you schedule a meeting tomorrow at 2pm? This is urgent.",
        mode: "balanced"
      })
    }),
    env
  );

  assert.equal(res.status, 200);
  const body = await res.json() as Record<string, any>;
  assert.notEqual(body.metadata, undefined);
  assert.equal(body.metadata.subject, "Customer launch");
  assert.ok(Array.isArray(body.tasks));
  assert.ok(body.tasks.length > 0);
  assert.ok(typeof body.draft_reply === "string");
  assert.ok(Array.isArray(body.calendar));
  assert.equal(body.ai_insight.available, true);
  assert.match(body.ai_insight.model, /gpt-oss/);
  assert.deepEqual(env.AI.calls.slice(0, 2), ["@cf/qwen/qwen3-30b-a3b-fp8", "@cf/openai/gpt-oss-20b"]);
  assert.equal(env.legacyUsageStore.writes.length, 0);
});

test("GET /health is protected and does not count usage", async () => {
  const env = makeEnv();
  const missing = await worker.fetch(new Request("https://example.com/health"), env);
  assert.equal(missing.status, 403);
  assert.equal(env.legacyUsageStore.writes.length, 0);

  const res = await worker.fetch(req("/health"), env);
  assert.equal(res.status, 200);
  assert.equal(env.legacyUsageStore.writes.length, 0);
});

test("GET /pingme is public and does not count usage", async () => {
  const env = makeEnv();
  const res = await worker.fetch(new Request("https://example.com/pingme"), env);
  const body = await res.json() as Record<string, unknown>;

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(env.legacyUsageStore.writes.length, 0);
});

test("GET /discover is protected, discoverable, and does not count usage", async () => {
  const env = makeEnv();
  const missing = await worker.fetch(new Request("https://example.com/discover"), env);
  assert.equal(missing.status, 403);
  assert.equal(env.legacyUsageStore.writes.length, 0);

  const res = await worker.fetch(req("/discover"), env);
  assert.equal(res.status, 200);
  const body = await res.json() as Record<string, any>;
  assert.equal(body.endpoint, "/v1/inbox-to-action");
  assert.deepEqual(body.required_headers, ["X-RapidAPI-Proxy-Secret", "X-RapidAPI-User"]);
  assert.equal(body.routes.execution, "POST /v1/inbox-to-action is protected, counts usage, and extracts inbox actions from the request body.");
  assert.equal(body.routes.pingme, "GET /pingme is public for RapidAPI backend checks and does not count usage.");
  assert.equal(body.routes.health, "GET /health is protected and does not count usage.");
  assert.equal(body.routes.discover, "GET /discover is protected, does not count usage, and describes this API for AI agents.");
  assert.equal(env.legacyUsageStore.writes.length, 0);
});


test("POST /v1/inbox-to-action reuses cache for repeated identical requests", async () => {
  const env = makeEnv();
  const payload = {
        subject: "Customer launch",
        email: "Hi team, please review the launch plan by 08/15/2026. Can you schedule a meeting tomorrow at 2pm? This is urgent.",
        mode: "balanced"
      };

  const first = await worker.fetch(req("/v1/inbox-to-action", { method: "POST", body: JSON.stringify(payload) }), env);
  assert.equal(first.status, 200);
  const firstBody = await first.json() as Record<string, any>;
  assert.equal(firstBody.cache.hit, false);

  const second = await worker.fetch(req("/v1/inbox-to-action", { method: "POST", body: JSON.stringify(payload) }), env);
  assert.equal(second.status, 200);
  const secondBody = await second.json() as Record<string, any>;
  assert.equal(secondBody.cache.hit, true);
  assert.deepEqual(env.AI.calls.slice(0, 2), ["@cf/qwen/qwen3-30b-a3b-fp8", "@cf/openai/gpt-oss-20b"]);
  assert.equal(env.AI.calls.length, 2);
  assert.equal(env.legacyUsageStore.writes.length, 0);
  assert.equal(env.CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API.writes.length, 1);
});

test("legacy usage override does not block requests", async () => {
  const env = { ...makeEnv(), legacyLimit: "1" } as MockEnv & { legacyLimit: string };
  const payload = { email: "Please review this message and send the update today." };

  const first = await worker.fetch(req("/v1/inbox-to-action", { method: "POST", body: JSON.stringify(payload) }), env);
  assert.equal(first.status, 200);

  const second = await worker.fetch(req("/v1/inbox-to-action", { method: "POST", body: JSON.stringify({ email: "Please schedule a call tomorrow." }) }), env);
  assert.equal(second.status, 200);
});

test("legacy usage override does not block paid RapidAPI tiers", async () => {
  const env = { ...makeEnv(), legacyLimit: "1" } as MockEnv & { legacyLimit: string };
  const paidHeaders = { "X-RapidAPI-Subscription": "PRO", "X-RapidAPI-User": "paid-user" };

  const first = await worker.fetch(req("/v1/inbox-to-action", { method: "POST", headers: paidHeaders, body: JSON.stringify({ email: "Please review this message and send the update today." }) }), env);
  assert.equal(first.status, 200);

  const second = await worker.fetch(req("/v1/inbox-to-action", { method: "POST", headers: paidHeaders, body: JSON.stringify({ email: "Please schedule a call tomorrow." }) }), env);
  assert.equal(second.status, 200);
});

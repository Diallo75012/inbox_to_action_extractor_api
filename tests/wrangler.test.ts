import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("wrangler.toml delegates request counting to RapidAPI", () => {
  const wranglerToml = readFileSync(new URL("../../wrangler.toml", import.meta.url), "utf8");
  assert.equal(/^MONTHLY_USER_LIMIT\s*=/.test(wranglerToml), false);
  assert.equal(/binding\s*=\s*"USAGE_KV/.test(wranglerToml), false);
  assert.match(wranglerToml, /\[\[kv_namespaces\]\][\s\S]*binding\s*=\s*"CACHE_KV/);
});

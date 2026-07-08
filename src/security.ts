import type { Env, SubscriptionTier } from "./types.js";

const SUBSCRIPTIONS = new Set(["BASIC", "PRO", "ULTRA", "MEGA", "CUSTOM"]);

function normalizeSubscription(value: string | null): SubscriptionTier | null {
  const normalized = (value ?? "").trim().toUpperCase();
  return SUBSCRIPTIONS.has(normalized) ? normalized as SubscriptionTier : null;
}

export function verifyRapidApiRequest(headers: Headers, env: Pick<Env, "RAPIDAPI_PROXY_SECRET">): { ok: true; user: string; subscription: SubscriptionTier } | { ok: false; status: number; error: string } {
  const expected = env.RAPIDAPI_PROXY_SECRET;
  const actual = headers.get("X-RapidAPI-Proxy-Secret") ?? "";
  if (!expected || actual !== expected) return { ok: false, status: 403, error: "Forbidden" };
  const user = headers.get("X-RapidAPI-User") ?? "";
  if (!user) return { ok: false, status: 403, error: "Missing RapidAPI user" };
  const subscriptionHeader = headers.get("X-RapidAPI-Subscription");
  const subscription = subscriptionHeader === null || subscriptionHeader.trim() === "" ? "BASIC" : normalizeSubscription(subscriptionHeader);
  if (!subscription) return { ok: false, status: 403, error: "Invalid RapidAPI subscription" };
  return { ok: true, user, subscription };
}

import { CACHE_CONFIG } from "./constants.js";
import type { AiInsight, UsageStore } from "./types.js";

export interface CachedPayload<TDeterministic> {
  deterministic: TDeterministic;
  aiInsight: AiInsight;
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildCacheKey(scope: string, payload: unknown): Promise<string> {
  const normalized = JSON.stringify(payload, Object.keys(payload as Record<string, unknown>).sort());
  return `${CACHE_CONFIG.keyPrefix}:${scope}:${await sha256Hex(normalized)}`;
}

export async function readCache<TDeterministic>(store: UsageStore | undefined, key: string): Promise<CachedPayload<TDeterministic> | null> {
  if (!CACHE_CONFIG.enabled || !store) return null;
  const raw = await store.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedPayload<TDeterministic>;
  } catch {
    return null;
  }
}

export async function writeCache<TDeterministic>(store: UsageStore | undefined, key: string, payload: CachedPayload<TDeterministic>): Promise<void> {
  if (!CACHE_CONFIG.enabled || !store) return;
  await store.put(key, JSON.stringify(payload), { expirationTtl: CACHE_CONFIG.ttlSeconds });
}


export async function readDocumentCache<TDocument>(store: UsageStore | undefined, key: string): Promise<TDocument | null> {
  if (!CACHE_CONFIG.enabled || !store) return null;
  const raw = await store.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TDocument;
  } catch {
    return null;
  }
}

export async function writeDocumentCache<TDocument>(store: UsageStore | undefined, key: string, document: TDocument, ttlSeconds: number = CACHE_CONFIG.ttlSeconds): Promise<void> {
  if (!CACHE_CONFIG.enabled || !store) return;
  await store.put(key, JSON.stringify(document), { expirationTtl: ttlSeconds });
}

import type { SubscriptionTier } from "./types.js";

export async function checkAndIncrementUsage(_input: { user: string; subscription: SubscriptionTier; env?: unknown }): Promise<{ allowed: boolean; count: null; limit: null }> {
  return { allowed: true, count: null, limit: null };
}

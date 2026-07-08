import type { AiInsight, FullResponse, InboxActionResponse } from "./types.js";
export function composeResponse(deterministic: InboxActionResponse, aiInsight: AiInsight, cacheHit = false): FullResponse & { cache: { hit: boolean } } { return { ...deterministic, ai_insight: aiInsight, cache: { hit: cacheHit } }; }

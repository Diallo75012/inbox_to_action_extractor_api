import { buildAiInsight } from "./ai.js";
import { buildCacheKey, readCache, readDocumentCache, writeCache, writeDocumentCache } from "./cache.js";
import { APP_CONFIG, CACHE_CONFIG } from "./constants.js";
import { extractInboxActions } from "./extractor.js";
import { checkAndIncrementUsage } from "./rate-limit.js";
import { composeResponse } from "./response.js";
import { verifyRapidApiRequest } from "./security.js";
import type { Env, InboxActionResponse, InboxRequest } from "./types.js";
import { json } from "./utils.js";

async function parseJson(request: Request): Promise<InboxRequest> {
  try {
    return await request.json() as InboxRequest;
  } catch {
    throw new Error("request body must be valid JSON");
  }
}

function buildDiscoveryDocument() {
  return {
    name: APP_CONFIG.name,
    version: APP_CONFIG.version,
    endpoint: APP_CONFIG.endpoint,
    method: "POST",
    required_headers: ["X-RapidAPI-Proxy-Secret", "X-RapidAPI-User"],
    input: {
      email: "string required",
      mode: APP_CONFIG.supportedModes,
      sender: "optional string",
      recipient: "optional string",
      subject: "optional string",
      context: "optional string or object"
    },
    output: ["metadata", "tasks", "draft_reply", "calendar", "ai_insight"],
    limits: {
      email_chars: APP_CONFIG.maxEmailChars,
      tasks: APP_CONFIG.maxTasks,
      calendar: APP_CONFIG.maxCalendarItems
    },
    routes: {
      execution: `POST ${APP_CONFIG.endpoint} is protected, counts usage, and extracts inbox actions from the request body.`,
      pingme: "GET /pingme is public for RapidAPI backend checks and does not count usage.",
      health: "GET /health is protected and does not count usage.",
      discover: "GET /discover is protected, does not count usage, and describes this API for AI agents."
    }
  };
}

async function guarded(
  request: Request,
  env: Env,
  handler: (user: string) => Promise<Response>
): Promise<Response> {
  const security = verifyRapidApiRequest(request.headers, env);
  if (!security.ok) return json({ error: security.error }, security.status);

  const usage = await checkAndIncrementUsage({ user: security.user, subscription: security.subscription, env });

  return handler(security.user);
}

function handlePingme(): Response {
  return json({ ok: true, name: APP_CONFIG.name });
}

async function handleHealth(request: Request, env: Env): Promise<Response> {
  return guarded(request, env, async () => json({ ok: true, name: APP_CONFIG.name }));
}

async function handleDiscover(request: Request, env: Env): Promise<Response> {
  return guarded(request, env, async () => {
    const cacheKey = await buildCacheKey("discover", { schema_version: APP_CONFIG.version });
    const cached = await readDocumentCache<ReturnType<typeof buildDiscoveryDocument>>(env.CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API, cacheKey);
    if (cached) return json(cached);

    const document = buildDiscoveryDocument();
    await writeDocumentCache(env.CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API, cacheKey, document, CACHE_CONFIG.discoveryTtlSeconds);
    return json(document);
  });
}

async function handleExtract(request: Request, env: Env): Promise<Response> {
  return guarded(request, env, async () => {
    try {
      const body = await parseJson(request);
      const cacheKey = await buildCacheKey("inbox-to-action", body);
      const cached = await readCache<InboxActionResponse>(env.CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API, cacheKey);
      if (cached) return json(composeResponse(cached.deterministic, cached.aiInsight, true));

      const deterministic = extractInboxActions(body);
      const aiInsight = await buildAiInsight({ request: body, deterministic, env });
      await writeCache(env.CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API, cacheKey, { deterministic, aiInsight });
      return json(composeResponse(deterministic, aiInsight, false));
    } catch (error) {
      return json({
        error: "Invalid request",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 400);
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/pingme") return handlePingme();
    if (request.method === "GET" && url.pathname === "/health") return handleHealth(request, env);
    if (request.method === "GET" && url.pathname === "/discover") return handleDiscover(request, env);
    if (request.method === "POST" && url.pathname === APP_CONFIG.endpoint) return handleExtract(request, env);

    return json({ error: "Not found" }, 404);
  }
};

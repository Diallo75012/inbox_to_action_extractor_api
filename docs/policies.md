# Inbox to Action Extractor API Policies

This document defines the operational, security, caching, AI, and product-output policies for the Inbox to Action Extractor API. It is intended to travel with this API when the folder is split into its own production repository.

## Route Protection Policy

| Route | Public? | Usage-counted? | Purpose |
| --- | --- | --- | --- |
| `GET /pingme` | Yes | No | RapidAPI backend uptime check only. It must not require RapidAPI headers because RapidAPI uses it to confirm the origin is reachable. |
| `GET /health` | No | Yes | Protected health check for authorized RapidAPI-proxied requests. Requires `X-RapidAPI-Proxy-Secret` and `X-RapidAPI-User`. |
| `GET /discover` | No | Yes | Protected AI-agent discovery metadata. Requires `X-RapidAPI-Proxy-Secret` and `X-RapidAPI-User`. |
| `POST /v1/inbox-to-action` | No | Yes | Protected execution endpoint. Requires `X-RapidAPI-Proxy-Secret` and `X-RapidAPI-User`. |

Direct origin calls to protected routes must return a stable `403` JSON error when the RapidAPI proxy secret is missing or invalid. Production secrets must be stored through Wrangler secrets, never committed to the repository.

## KV Usage Policy

The app uses two separate KV responsibilities:

2. `CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API` stores short-lived cached responses for repeated protected discovery and execution requests.

Usage KV and cache KV must remain separate bindings so usage/audit data is not mixed with short-TTL response cache data. Replace placeholder namespace IDs in `wrangler.toml` before production deploys.

## Cache Policy

Protected `POST /v1/inbox-to-action` responses may include:

```json
{
  "cache": {
    "hit": false
  }
}
```

`cache.hit: false` means the Worker generated the response and wrote a cache entry. `cache.hit: true` means the Worker reused an identical cached execution response.

Cache behavior must not change the product contract:

* deterministic `metadata`, `tasks`, `draft_reply`, and `calendar` remain the source of truth
* cached responses must preserve the same stable JSON schema as fresh responses
* cache hits must not call Workers AI again
* `GET /pingme` must remain uncached, public, and uncounted

## Workers AI Policy

Workers AI is optional and additive. AI guidance may summarize reviewer focus areas from the submitted email and deterministic extraction, but it must not:

* browse, access inboxes, send email, or schedule calendar events
* claim tasks, dates, draft replies, or calendar suggestions are verified, sent, scheduled, or approved
* override deterministic tasks, draft reply text, calendar suggestions, or urgency
* invent facts not present in the submitted email or deterministic result

If AI is disabled or unavailable, the API must still return deterministic JSON with `ai_insight.available = false`.

## Product Output Policy

Extracted actions are drafts for human review. The API must preserve these caps:

* tasks: maximum 8
* calendar suggestions: maximum 5

Responses must remain informational. Draft replies are not sent, and calendar suggestions are not scheduled.

## Privacy and Data Handling Policy

The API processes only the text submitted in the request. It must not connect to inboxes, scrape, perform SMTP verification, send messages, store production secrets in code, or claim independent verification. Do not log full email bodies unless a future production logging policy explicitly allows it.

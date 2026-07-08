# Inbox to Action Extractor API
## RapidAPI Request Counting


A Cloudflare Worker API that turns raw email text into a stable JSON action plan for automation tools, AI agents, support teams, and operators.

The previous Flask/web UI/provider-storage application has been simplified into a RapidAPI-ready Worker API with one protected product endpoint and constants-first configuration.

## Endpoint

```text
POST /v1/inbox-to-action
```

Required RapidAPI headers:

```text
X-RapidAPI-Proxy-Secret: <configured proxy secret>
X-RapidAPI-User: <rapidapi user id>
```

## Request

```json
{
  "email": "Hi team, please send the launch report by 08/15/2026 and schedule a call tomorrow at 2pm.",
  "mode": "balanced",
  "subject": "Launch follow-up",
  "sender": "customer@example.com",
  "recipient": "team@example.com"
}
```

`mode` may be `concise`, `balanced`, or `detailed`.

## Response

```json
{
  "metadata": {
    "mode": "balanced",
    "version": "1.0.0",
    "email_chars": 94,
    "subject": "Launch follow-up",
    "detected_urgency": "medium"
  },
  "tasks": [
    {
      "id": "task_1",
      "title": "please send the launch report by 08/15/2026 and schedule a call tomorrow at 2pm.",
      "priority": "medium",
      "source": "please send the launch report by 08/15/2026 and schedule a call tomorrow at 2pm."
    }
  ],
  "draft_reply": "Thanks for reaching out...",
  "calendar": [
    {
      "title": "please send the launch report by 08/15/2026 and schedule a call tomorrow at 2pm.",
      "date": "15/08/2026",
      "time": "2pm",
      "source": "please send the launch report by 08/15/2026 and schedule a call tomorrow at 2pm."
    }
  ],
  "ai_insight": {
    "available": true,
    "model": "@cf/qwen/qwen3-30b-a3b-fp8",
    "summary": "Review the extracted date and confirm ownership before sending the reply.",
    "limitations": ["AI extraction is based only on the submitted email text."]
  }
}
```

If Workers AI is disabled or unavailable, the deterministic fields are still returned and `ai_insight.available` is `false`.

## Routes


## Local Setup

```bash
npm install
cp .dev.vars.example .dev.vars
npm test
npm run dev
```

Set `RAPIDAPI_PROXY_SECRET` in `.dev.vars` for local protected-route testing. Do not commit `.dev.vars`.

Operational, security, cache, AI, privacy, and no-claims policies are documented in [`docs/policies.md`](docs/policies.md).

## Deployment

```bash
npm run build
wrangler deploy
```

Before production, replace placeholder usage and cache KV IDs in `wrangler.toml`, create the namespaces, bind Workers AI, and set the RapidAPI proxy secret with Wrangler secrets.


## Limitations

* No email inbox connection, scraping, SMTP verification, or message sending.
* Calendar suggestions are drafts and are not inserted into a calendar.
* Numeric dates are normalized to `DD/MM/YYYY` when detected; natural language dates may need human review.
* AI guidance is informational and must not override deterministic output or user review.

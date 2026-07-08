# Inbox to Action Extractor API — RapidAPI README

## Overview

Inbox to Action Extractor API converts submitted email or inbox message text into structured action output for RapidAPI consumers, AI agents, support teams, operations teams, and no-code automations.

The API returns:

* `metadata` about mode, input size, subject, and detected urgency
* capped `tasks`
* an editable `draft_reply` string
* capped `calendar` suggestions
* `ai_insight` when Workers AI guidance is available
* `cache.hit` to indicate whether an identical protected request was reused from the provider cache

Deterministic fields are the source of truth. `ai_insight` is optional, informational, and safe to ignore.

## RapidAPI Authentication

When calling through RapidAPI, use the headers shown in your RapidAPI dashboard:

```text
X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
X-RapidAPI-Host: YOUR_RAPIDAPI_HOST
Content-Type: application/json
```

RapidAPI handles provider-side origin authentication. Consumers do not need the provider proxy secret directly.

## Consumer Endpoints

### `GET /discover`

Protected RapidAPI route that returns machine-readable metadata about the API. Use this when an AI agent or integration wants to inspect supported input fields, output fields, limits, and route behavior before calling the execution endpoint.

### `POST /v1/inbox-to-action`

Protected execution route that converts submitted email text into tasks, draft reply text, and calendar suggestions.

RapidAPI consumers should use only `GET /discover` and `POST /v1/inbox-to-action`. Internal provider/system check routes are intentionally not part of the consumer-facing RapidAPI README.

## Request Body

```json
{
  "subject": "Client follow-up",
  "email": "Please send the revised quote by 08/15/2026 and schedule a follow-up call tomorrow at 2pm.",
  "mode": "balanced",
  "sender": "customer@example.com",
  "recipient": "team@example.com",
  "context": "Sales follow-up workflow"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string | Yes | Raw email or inbox message text. Max 12,000 characters. |
| `mode` | string | No | One of `concise`, `balanced`, or `detailed`. Defaults to `balanced`. |
| `subject` | string | No | Optional email subject for metadata and draft reply context. |
| `sender` | string | No | Optional sender label or email. |
| `recipient` | string | No | Optional recipient label or email. |
| `context` | string or object | No | Optional context used only for extraction framing and AI insight. |

## Example Request

```bash
curl --request POST \
  --url https://YOUR_RAPIDAPI_HOST/v1/inbox-to-action \
  --header 'Content-Type: application/json' \
  --header 'X-RapidAPI-Key: YOUR_RAPIDAPI_KEY' \
  --header 'X-RapidAPI-Host: YOUR_RAPIDAPI_HOST' \
  --data '{"subject":"Client follow-up","email":"Please send the revised quote by 08/15/2026 and schedule a follow-up call tomorrow at 2pm.","mode":"balanced"}'
```

## Example Response

```json
{
  "metadata": {
    "mode": "balanced",
    "version": "1.0.0",
    "email_chars": 96,
    "subject": "Client follow-up",
    "detected_urgency": "low"
  },
  "tasks": [
    {
      "id": "task_1",
      "title": "Please send the revised quote by 08/15/2026 and schedule a follow-up call tomorrow at 2pm",
      "priority": "low",
      "source": "Please send the revised quote by 08/15/2026 and schedule a follow-up call tomorrow at 2pm"
    }
  ],
  "draft_reply": "Thanks for reaching out. I captured the requested next steps and will review them before taking action.",
  "calendar": [
    {
      "title": "Please send the revised quote by 08/15/2026 and schedule a follow-up call tomorrow at 2pm",
      "date": "15/08/2026",
      "time": "2pm",
      "source": "Please send the revised quote by 08/15/2026 and schedule a follow-up call tomorrow at 2pm"
    }
  ],
  "ai_insight": {
    "available": false,
    "model": null,
    "summary": null,
    "reason": "ai_disabled_or_unavailable"
  },
  "cache": {
    "hit": false
  }
}
```

## Response Field Guide

| Field | Meaning |
| --- | --- |
| `metadata` | Mode, version, input character count, subject, and detected urgency. |
| `tasks` | Capped action items extracted from submitted text. |
| `draft_reply` | Editable draft reply string. It is not sent by the API. |
| `calendar` | Capped calendar suggestions. Nothing is scheduled by the API. |
| `ai_insight` | Optional AI reviewer guidance. It is not verification or approval. |
| `cache.hit` | `false` on a fresh generated response; `true` when an identical protected request reused a short-lived cached response. |

## AI-Agent Discovery Example

```bash
curl --request GET \
  --url https://YOUR_RAPIDAPI_HOST/discover \
  --header 'X-RapidAPI-Key: YOUR_RAPIDAPI_KEY' \
  --header 'X-RapidAPI-Host: YOUR_RAPIDAPI_HOST'
```

A discovery response includes the API name, version, endpoint path, method, required input shape, output field names, limits, and route notes. AI agents should call `/discover` before execution when they need tool metadata.

## Cache Behavior for Consumers

The provider may reuse short-lived cached responses for identical protected requests. This improves latency and avoids unnecessary repeated AI calls. Consumers should treat cached and fresh responses the same because the deterministic schema is stable.

Important details:

* `cache.hit: false` means a fresh response was generated.
* `cache.hit: true` means an identical response was reused.
* Cache hits still require a valid RapidAPI request and still count according to the product plan.
* Cache behavior does not send email, schedule calendar events, approve actions, or verify dates.

## Important Limitations

* Does not access inboxes or email accounts.
* Does not send email.
* Does not schedule calendar events.
* Does not verify tasks, dates, replies, deliverability, or calendar availability.
* Output is capped to keep responses predictable: max 8 tasks and 5 calendar suggestions.
* AI insight is optional and may be unavailable.
* Review all generated actions before sending replies or scheduling events.

## Common Error Responses

```json
{ "error": "Forbidden" }
```

```json
{ "error": "Invalid request", "details": "email is required" }
```

```json
```

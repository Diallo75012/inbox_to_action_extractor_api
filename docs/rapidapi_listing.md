# RapidAPI Listing Draft

## Name
Inbox to Action Extractor API

## Short Description
Extract tasks, draft replies, and calendar suggestions from raw email text, with a discovery route for AI-agent tool setup.

## Long Description
Inbox to Action Extractor API converts a pasted email or inbox message into a stable JSON action plan for automation workflows, AI agents, support teams, and operators. The main execution endpoint returns capped tasks, an editable draft reply, calendar suggestions, metadata, and optional Workers AI reviewer guidance.

The API also exposes a protected `GET /discover` route for AI-agent discovery before tool use. Agent builders can call `/discover` through RapidAPI to inspect the product endpoint, supported schema, limits, required headers, and route metadata before deciding whether to call `POST /v1/inbox-to-action`.

This API does not connect to inboxes, send email, schedule meetings, or verify dates/tasks. It only structures the email text submitted in the request.

## Highlights

* Cloudflare Worker API designed for RapidAPI proxy integration.
* `GET /discover` helps AI agents and automation clients understand the tool before execution.
* `POST /v1/inbox-to-action` extracts tasks, draft replies, and calendar suggestions from submitted email text.
* Stable JSON response with `metadata`, `tasks`, `draft_reply`, `calendar`, and `ai_insight`.
* Workers AI insight with Qwen, GPT-OSS, and Llama fallback when available.
* Deterministic fallback output when AI is disabled or unavailable.
* No inbox access, no email sending, no calendar writes, and no verification claims.

## Routes

### `GET /discover`
Protected AI-agent discovery route. Use this before execution when an AI agent, workflow builder, or integration client needs machine-readable metadata about the tool.

When calling through RapidAPI, include your normal RapidAPI request headers:

* `X-RapidAPI-Key`
* `X-RapidAPI-Host`

RapidAPI forwards the proxy-secret and user headers to the Worker origin.

Returns metadata such as:

* app name and version
* primary execution endpoint
* supported HTTP method
* required headers
* request schema summary
* response field summary
* input limits and caps
* safety notes and usage constraints


### `POST /v1/inbox-to-action`
Main execution endpoint. Submit raw email text and receive structured action extraction.

When calling through RapidAPI, include your normal RapidAPI request headers:

* `X-RapidAPI-Key`
* `X-RapidAPI-Host`

RapidAPI forwards the proxy-secret and user headers to the Worker origin.

## Example Discovery Request

```bash
curl --request GET \
  --url https://YOUR_RAPIDAPI_HOST/discover \
  --header 'X-RapidAPI-Host: YOUR_RAPIDAPI_HOST' \
  --header 'X-RapidAPI-Key: YOUR_RAPIDAPI_KEY'
```

## Example Execution Request

```bash
curl --request POST \
  --url https://YOUR_RAPIDAPI_HOST/v1/inbox-to-action \
  --header 'Content-Type: application/json' \
  --header 'X-RapidAPI-Host: YOUR_RAPIDAPI_HOST' \
  --header 'X-RapidAPI-Key: YOUR_RAPIDAPI_KEY' \
  --data '{
    "subject": "Client follow-up",
    "email": "Please send the revised quote by Friday and schedule a follow-up next week.",
    "mode": "balanced"
  }'
```

## Limitations

* Does not access email accounts or inboxes.
* Does not send, approve, or schedule anything.
* Does not verify task accuracy, dates, or availability.
* AI insight is informational, additive, and may be unavailable.

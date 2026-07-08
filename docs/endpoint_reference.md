# Endpoint Reference
## RapidAPI Request Counting



## GET /discover


## POST /v1/inbox-to-action

Protected by `X-RapidAPI-Proxy-Secret` and `X-RapidAPI-User`.

### Input Fields

* `email` — required string, max 12,000 characters.
* `mode` — optional: `concise`, `balanced`, or `detailed`.
* `subject` — optional string.
* `sender` — optional string.
* `recipient` — optional string.
* `context` — optional string or object.

### Output Fields

* `metadata` — mode, app version, input size, subject, detected urgency.
* `tasks` — capped action items with priority and source text.
* `draft_reply` — editable reply draft.
* `calendar` — capped calendar suggestions with `DD/MM/YYYY` date when deterministic parsing can normalize it.
* `ai_insight` — Workers AI reviewer guidance or unavailable reason.

## Caching

Protected execution responses may include `cache.hit`. `false` means the Worker generated and wrote a cache entry; `true` means the Worker reused an identical cached response from `CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API`. Protected `/discover` responses are also cached for a short TTL. Public `/pingme` remains unprotected, uncounted, and reserved for RapidAPI backend uptime checks.

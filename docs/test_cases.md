# Test Cases
## RapidAPI Request Counting


Run:

```bash
npm test
npm run typecheck
```

Coverage includes:

* missing email rejection
* unsupported mode rejection
* capped deterministic tasks and calendar suggestions
* numeric date normalization to `DD/MM/YYYY`
* RapidAPI proxy-secret rejection for `POST /v1/inbox-to-action`
* public and uncounted `GET /pingme` for RapidAPI backend checks
* Workers AI fallback from Qwen to GPT-OSS with mocked AI binding

## Cache behavior

- Repeated identical protected execution requests should return the same stable schema with `cache.hit: true` on the second call.
- `GET /pingme` must remain public and uncounted for RapidAPI backend checks only.

## Deployment configuration parity


# AGENTS.md — Inbox to Action Extractor API

This folder is a standalone Cloudflare Worker API app and follows the workspace root `AGENTS.md` conventions.

## Product Contract

Core purpose: convert raw email or inbox message text into a capped action extraction with:

* `metadata`
* `tasks`
* `draft_reply`
* `calendar`
* `ai_insight`

Endpoint:

```text
POST /v1/inbox-to-action
```

Public RapidAPI backend check:

```text
GET /pingme
```

Protected and usage-counted metadata endpoints:

```text
GET /health
GET /discover
```

## Ground Rules

* Use Cloudflare Workers, TypeScript, Wrangler, and Hono-compatible Fetch API patterns.
* Keep route handling thin in `src/index.ts`.
* Keep business configuration, caps, model names, prompt budgets, and dictionaries in `src/constants.ts`.
* Deterministic extraction must always return the stable schema when input is valid.
* Workers AI is required for the product concept but must remain additive and safely nullable if unavailable.
* Do not bring back Flask, SQLite, Docker UI assets, browser UI templates, or user-managed provider storage.
* Do not claim that tasks, dates, replies, or calendar items are verified.
* Dates discovered from numeric dates should be normalized to `DD/MM/YYYY` when possible.
* Unit tests must mock the Workers AI binding; do not call live AI from tests.

## Required AI Fallback Order

Keep these model names centralized in `src/constants.ts` unless intentionally changed with docs and tests:

1. `@cf/qwen/qwen3-30b-a3b-fp8`
2. `@cf/openai/gpt-oss-20b`
3. `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

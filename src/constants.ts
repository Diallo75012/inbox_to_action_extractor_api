export const APP_CONFIG = {
  name: "Inbox to Action Extractor API",
  slug: "inbox_to_action_extractor_api",
  version: "1.0.0",
  endpoint: "/v1/inbox-to-action",
  maxEmailChars: 12000,
  maxTasks: 8,
  maxCalendarItems: 5,
  maxSubjectChars: 120,
  defaultMode: "balanced",
  supportedModes: ["concise", "balanced", "detailed"] as const,
  urgencyKeywords: ["urgent", "asap", "today", "tomorrow", "deadline", "blocked", "critical"],
  taskSignals: ["please", "can you", "could you", "need", "needs", "action", "follow up", "send", "review", "approve", "schedule", "prepare", "confirm"],
  calendarSignals: ["meeting", "call", "demo", "deadline", "due", "appointment", "webinar", "interview"],
  replyOpeners: {
    concise: "Thanks for the note.",
    balanced: "Thanks for reaching out.",
    detailed: "Thanks for sharing the details. I reviewed the message and captured the key next steps below."
  }
} as const;

export const CACHE_CONFIG = {
  enabled: true,
  keyPrefix: "inbox-to-action:cache",
  ttlSeconds: 300,
  discoveryTtlSeconds: 3600
} as const;

export const AI_CONFIG = {
  enabledByDefault: true,
  models: {
    primary: "@cf/qwen/qwen3-30b-a3b-fp8",
    fallback1: "@cf/openai/gpt-oss-20b",
    fallback2: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
  },
  maxTokens: 700,
  temperature: 0.2,
  unavailableReason: "ai_disabled_or_unavailable",
  limitations: [
    "AI extraction is based only on the submitted email text.",
    "Review action items, dates, and reply text before sending or scheduling."
  ]
} as const;



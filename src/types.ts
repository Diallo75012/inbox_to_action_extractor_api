import type { APP_CONFIG } from "./constants.js";
export type SubscriptionTier = "BASIC" | "PRO" | "ULTRA" | "MEGA" | "CUSTOM";
export type Mode = typeof APP_CONFIG.supportedModes[number];
export interface UsageStore { get(key: string): Promise<string | null>; put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>; }

export interface Env { RAPIDAPI_PROXY_SECRET?: string; APP_ENV?: string; AI_ENABLED?: string; AI_MODEL_PRIMARY?: string; AI_MODEL_FALLBACK_1?: string; AI_MODEL_FALLBACK_2?: string; AI?: { run(model: string, input: unknown): Promise<unknown> }; CACHE_KV_INBOX_TO_ACTION_EXTRACTOR_API?: UsageStore; }
export interface InboxRequest { email?: string; mode?: Mode; sender?: string; recipient?: string; subject?: string; context?: string | Record<string, unknown>; }
export interface ActionTask { id: string; title: string; priority: "low" | "medium" | "high"; source: string; }
export interface CalendarSuggestion { title: string; date: string | null; time: string | null; source: string; }
export interface InboxActionResponse { metadata: { mode: Mode; version: string; email_chars: number; subject: string | null; detected_urgency: "low" | "medium" | "high" }; tasks: ActionTask[]; draft_reply: string; calendar: CalendarSuggestion[]; }
export type AiInsight = { available: true; model?: string; summary: string; limitations: string[] } | { available: false; model?: null; summary: null; reason: string };
export interface FullResponse extends InboxActionResponse { ai_insight: AiInsight; }

import { APP_CONFIG } from "./constants.js";
import type { ActionTask, CalendarSuggestion, InboxActionResponse, InboxRequest, Mode } from "./types.js";

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("email is required");
  const email = value.replace(/\r\n/g, "\n").trim();
  if (email.length > APP_CONFIG.maxEmailChars) throw new Error(`email must be ${APP_CONFIG.maxEmailChars} characters or fewer`);
  return email;
}
function normalizeMode(mode: unknown): Mode {
  if (typeof mode === "undefined" || mode === null || mode === "") return APP_CONFIG.defaultMode;
  if (typeof mode === "string" && (APP_CONFIG.supportedModes as readonly string[]).includes(mode)) return mode as Mode;
  throw new Error(`mode must be one of: ${APP_CONFIG.supportedModes.join(", ")}`);
}
function sentences(email: string): string[] { return email.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean); }
function priority(text: string): "low" | "medium" | "high" { const lower = text.toLowerCase(); const hits = APP_CONFIG.urgencyKeywords.filter((word) => lower.includes(word)).length; if (hits >= 2 || /\b(asap|critical|urgent)\b/i.test(text)) return "high"; if (hits === 1) return "medium"; return "low"; }
function titleFrom(sentence: string): string { return sentence.replace(/^(hi|hello|hey)\b[^,]*,?/i, "").replace(/\s+/g, " ").trim().slice(0, 140) || "Review email and follow up"; }
function extractTasks(email: string): ActionTask[] { const found: ActionTask[] = []; for (const sentence of sentences(email)) { const lower = sentence.toLowerCase(); if (APP_CONFIG.taskSignals.some((signal) => lower.includes(signal))) found.push({ id: `task_${found.length + 1}`, title: titleFrom(sentence), priority: priority(sentence), source: sentence.slice(0, 240) }); if (found.length >= APP_CONFIG.maxTasks) break; } if (!found.length) found.push({ id: "task_1", title: "Review the email and decide the next response", priority: priority(email), source: email.slice(0, 240) }); return found; }
function formatDate(raw: string): string | null { const mdy = raw.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/); if (mdy) { const mm = mdy[1].padStart(2, "0"); const dd = mdy[2].padStart(2, "0"); const yyyy = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3]; return `${dd}/${mm}/${yyyy}`; } return null; }
function extractTime(raw: string): string | null { return raw.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm|AM|PM)\b/)?.[0] ?? null; }
function extractCalendar(email: string): CalendarSuggestion[] { const items: CalendarSuggestion[] = []; for (const sentence of sentences(email)) { const lower = sentence.toLowerCase(); const hasDate = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(sentence); if (hasDate || APP_CONFIG.calendarSignals.some((signal) => lower.includes(signal))) { items.push({ title: titleFrom(sentence).slice(0, 100), date: formatDate(sentence), time: extractTime(sentence), source: sentence.slice(0, 240) }); } if (items.length >= APP_CONFIG.maxCalendarItems) break; } return items; }
function buildDraftReply(request: InboxRequest, tasks: ActionTask[], mode: Mode): string { const opener = APP_CONFIG.replyOpeners[mode]; const taskLine = tasks.length ? `I will follow up on: ${tasks.map((t) => t.title).join("; ")}.` : "I will review and follow up with next steps."; const close = mode === "concise" ? "Best," : "Please let me know if there is anything else I should include.\n\nBest,"; return `${opener}\n\n${taskLine}\n\n${close}`; }
export function extractInboxActions(request: InboxRequest): InboxActionResponse { const email = normalizeEmail(request.email); const mode = normalizeMode(request.mode); const tasks = extractTasks(email); const calendar = extractCalendar(email); const detected = priority(email); const subject = typeof request.subject === "string" && request.subject.trim() ? request.subject.trim().slice(0, APP_CONFIG.maxSubjectChars) : null; return { metadata: { mode, version: APP_CONFIG.version, email_chars: email.length, subject, detected_urgency: detected }, tasks, draft_reply: buildDraftReply(request, tasks, mode), calendar }; }

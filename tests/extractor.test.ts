import test from "node:test";
import assert from "node:assert/strict";
import { APP_CONFIG } from "../src/constants.js";
import { extractInboxActions } from "../src/extractor.js";

test("extracts capped tasks, draft reply, and DD/MM/YYYY calendar suggestions", () => { const result = extractInboxActions({ email: "Please send the report by 12/31/2026. Schedule a call at 9am tomorrow. This is urgent.", mode: "concise" }); assert.equal(result.metadata.mode, "concise"); assert.equal(result.tasks.length <= APP_CONFIG.maxTasks, true); assert.equal(result.calendar.length <= APP_CONFIG.maxCalendarItems, true); assert.equal(result.calendar[0].date, "31/12/2026"); assert.match(result.draft_reply, /Thanks/); });
test("rejects missing email and unsupported mode", () => { assert.throws(() => extractInboxActions({}), /email is required/); assert.throws(() => extractInboxActions({ email: "hello", mode: "bad" as never }), /mode must be one of/); });

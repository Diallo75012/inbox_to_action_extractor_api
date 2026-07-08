export function json(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }
export function compactWhitespace(value: string): string { return value.replace(/\s+/g, " ").trim(); }
export async function sha256(input: string): Promise<string> { const data = new TextEncoder().encode(input); const hash = await crypto.subtle.digest("SHA-256", data); return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""); }

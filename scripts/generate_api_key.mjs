#!/usr/bin/env node
import { randomBytes } from "node:crypto";

const DEFAULT_BYTES = 32;
const MIN_BYTES = 16;
const MAX_BYTES = 128;

function parseByteLength(value) {
  if (value === undefined) return DEFAULT_BYTES;
  const bytes = Number.parseInt(value, 10);
  if (!Number.isInteger(bytes) || String(bytes) !== String(value).trim()) {
    throw new Error("byte length must be a whole number");
  }
  if (bytes < MIN_BYTES || bytes > MAX_BYTES) {
    throw new Error(`byte length must be between ${MIN_BYTES} and ${MAX_BYTES}`);
  }
  return bytes;
}

function generateSecret(bytes = DEFAULT_BYTES) {
  return randomBytes(bytes).toString("base64url");
}

function printUsage() {
  console.log("Usage: node scripts/generate_api_key.mjs [bytes]");
  console.log(`Default: ${DEFAULT_BYTES} bytes (${DEFAULT_BYTES * 8} bits of entropy).`);
  console.log(`Allowed range: ${MIN_BYTES}-${MAX_BYTES} bytes.`);
}

const arg = process.argv[2];

if (arg === "--help" || arg === "-h") {
  printUsage();
  process.exit(0);
}

try {
  const bytes = parseByteLength(arg);
  const secret = generateSecret(bytes);
  console.log(secret);
  console.error(`Generated ${bytes * 8}-bit URL-safe secret for RAPIDAPI_PROXY_SECRET.`);
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : "unknown error"}`);
  printUsage();
  process.exit(1);
}

import crypto from "node:crypto";

/** payOS requires a positive integer orderCode (unique per payment link). */
const MIN_ORDER_CODE = 1_000_000;
const MAX_ORDER_CODE = 9_007_199_254_099;

/**
 * Deterministic integer from Mongo/public order id (fallback when random generation is not used).
 * @param {string} orderId
 */
export function hashOrderIdToPayosOrderCode(orderId) {
  const digest = crypto.createHash("sha256").update(String(orderId)).digest();
  let value = 0n;
  for (let i = 0; i < 6; i += 1) {
    value = (value << 8n) | BigInt(digest[i]);
  }
  const span = BigInt(MAX_ORDER_CODE - MIN_ORDER_CODE);
  return Number(value % span) + MIN_ORDER_CODE;
}

/**
 * Timestamp + random suffix — low collision risk for concurrent creates.
 */
export function generatePayosOrderCode() {
  const timePart = Date.now() % 10_000_000_000;
  const randomPart = crypto.randomInt(0, 1000);
  const raw = timePart * 1000 + randomPart;
  if (raw >= MIN_ORDER_CODE && raw <= MAX_ORDER_CODE) return raw;
  return MIN_ORDER_CODE + (raw % (MAX_ORDER_CODE - MIN_ORDER_CODE));
}

/**
 * @param {(code: number) => Promise<boolean>} isTaken — return true if code already exists
 * @param {number} [maxAttempts]
 */
export async function allocateUniquePayosOrderCode(isTaken, maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generatePayosOrderCode();
    if (code < MIN_ORDER_CODE || code > MAX_ORDER_CODE) continue;
    const taken = await isTaken(code);
    if (!taken) return code;
  }
  throw new Error("Could not allocate a unique payOS orderCode");
}

/**
 * payOS description max length is 25 characters.
 * @param {string} text
 */
export function formatPayosDescription(text) {
  const normalized = String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= 25) return normalized;
  return normalized.slice(0, 22) + "...";
}

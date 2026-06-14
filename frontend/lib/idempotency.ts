/**
 * Correlation / idempotency identifiers for backend headers.
 */

function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteCount; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** RFC 4122 version-4 UUID for X-Request-Id */
export function createRequestId(): string {
  const hex = randomHex(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

/** Idempotency-Key for POST .../accept and POST .../pay */
export function createIdempotencyKey(prefix = "idem"): string {
  return `${prefix}-${createRequestId()}`;
}

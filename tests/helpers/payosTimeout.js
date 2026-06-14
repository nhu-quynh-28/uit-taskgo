/**
 * Mirrors backend payment.service `withTimeout` for payOS createPaymentLink tests.
 * Production gateway should wrap external calls the same way.
 */
export function withPayosTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("PAYOS_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

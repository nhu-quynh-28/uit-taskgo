import { PayOS } from "@payos/node";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let payosClient = null;

/**
 * Lazily initialize the payOS Merchant API client from environment variables.
 * @returns {PayOS}
 */
export function getPayOSClient() {
  if (!env.payosConfigured) {
    throw new Error(
      "PayOS is not configured — set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY",
    );
  }

  if (!payosClient) {
    payosClient = new PayOS({
      clientId: env.payosClientId,
      apiKey: env.payosApiKey,
      checksumKey: env.payosChecksumKey,
      logLevel: env.nodeEnv === "development" ? "info" : "warn",
    });
    logger.info("PayOS client initialized");
  }

  return payosClient;
}

/**
 * Create a payment link (SDK: paymentRequests.create).
 * @param {PayOS} payos
 * @param {import('@payos/node').CreatePaymentLinkRequest} paymentData
 */
export async function createPaymentLink(payos, paymentData) {
  return payos.paymentRequests.create(paymentData);
}

/**
 * Verify webhook payload integrity (SDK: webhooks.verify).
 * @param {PayOS} payos
 * @param {import('@payos/node').Webhook} body
 */
export async function verifyPaymentWebhookData(payos, body) {
  return payos.webhooks.verify(body);
}

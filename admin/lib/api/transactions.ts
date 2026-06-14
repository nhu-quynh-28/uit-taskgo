import type { Transaction } from "@/lib/mock-data";
import { apiRequest, ApiError } from "./client";
import { fetchUserName } from "./orders";
import type { ApiOrder } from "./adapters/orders";
import {
  mapApiPaymentToTransaction,
  mapApiTransactionToTransaction,
  type ApiPayment,
  type ApiTransaction,
} from "./adapters/transactions";

const API_NOT_CONNECTED = "API client is not connected";

function isTransactionsEndpointUnavailable(err: unknown): boolean {
  if (err instanceof ApiError && (err.status === 404 || err.code === "NOT_FOUND")) {
    return true;
  }
  if (err instanceof Error && err.message.includes(API_NOT_CONNECTED)) {
    return true;
  }
  return false;
}

async function tryFetchFromPath<T>(path: string): Promise<T[] | null> {
  try {
    return await apiRequest<T[]>(path, { allowLive: true });
  } catch (err) {
    if (isTransactionsEndpointUnavailable(err)) {
      return null;
    }
    throw err;
  }
}

async function enrichPaymentsWithParties(payments: ApiPayment[]): Promise<Transaction[]> {
  try {
    const orders = await apiRequest<ApiOrder[]>("/orders", { allowLive: true });
    const partyByOrderId = new Map<string, string>();
    await Promise.all(
      orders.map(async (o) => {
        const name = await fetchUserName(o.customerId);
        partyByOrderId.set(o.id, name);
      }),
    );

    return payments.map((payment) =>
      mapApiPaymentToTransaction(
        payment,
        partyByOrderId.get(payment.orderId) ?? payment.orderId,
      ),
    );
  } catch {
    return payments.map((payment) =>
      mapApiPaymentToTransaction(payment, payment.orderId),
    );
  }
}

export type FetchTransactionsListResult =
  | { source: "api"; transactions: Transaction[] }
  | { source: "mock" };

/**
 * Loads ledger entries from GET /payments, then GET /transactions.
 * Returns `{ source: "mock" }` when neither route exists yet.
 */
export async function fetchTransactionsForAdmin(): Promise<FetchTransactionsListResult> {
  const payments = await tryFetchFromPath<ApiPayment>("/payments");
  if (payments !== null) {
    const transactions = await enrichPaymentsWithParties(payments);
    return { source: "api", transactions };
  }

  const transactions = await tryFetchFromPath<ApiTransaction>("/transactions");
  if (transactions !== null) {
    return {
      source: "api",
      transactions: transactions.map(mapApiTransactionToTransaction),
    };
  }

  return { source: "mock" };
}

export type { ApiPayment, ApiTransaction };

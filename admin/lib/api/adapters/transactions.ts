import { format } from "date-fns";
import type { Transaction } from "@/lib/mock-data";

/** Expected shape when GET /payments is implemented. */
export type ApiPayment = {
  id: string;
  orderId: string;
  traceId?: string;
  provider?: string;
  amount: number;
  status: string;
  paidAt?: string | null;
  createdAt?: string;
};

/** Expected shape when GET /transactions is implemented. */
export type ApiTransaction = {
  id: string;
  date?: string;
  createdAt?: string;
  party?: string;
  partyName?: string;
  type?: string;
  amount: number;
  status?: string;
};

function formatTransactionDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

function mapPaymentType(status: string): Transaction["type"] {
  switch (status.toLowerCase()) {
    case "refunded":
      return "refund";
    case "failed":
      return "payout";
    case "succeeded":
    default:
      return "commission";
  }
}

function mapTransactionType(type?: string): Transaction["type"] {
  switch (type?.toLowerCase()) {
    case "payout":
      return "payout";
    case "commission":
      return "commission";
    case "refund":
      return "refund";
    case "bonus":
      return "bonus";
    default:
      return "commission";
  }
}

function mapTransactionStatus(status?: string): Transaction["status"] {
  switch (status?.toLowerCase()) {
    case "completed":
    case "succeeded":
    case "paid":
      return "completed";
    case "failed":
      return "failed";
    case "pending":
    case "processing":
    default:
      return "pending";
  }
}

export function mapApiPaymentToTransaction(
  payment: ApiPayment,
  party = "—",
): Transaction {
  return {
    id: payment.id,
    date: formatTransactionDate(payment.paidAt ?? payment.createdAt),
    party,
    type: mapPaymentType(payment.status),
    amount: payment.amount,
    status: mapTransactionStatus(payment.status),
  };
}

export function mapApiTransactionToTransaction(api: ApiTransaction): Transaction {
  return {
    id: api.id,
    date: formatTransactionDate(api.date ?? api.createdAt),
    party: api.partyName ?? api.party ?? "—",
    type: mapTransactionType(api.type),
    amount: api.amount,
    status: mapTransactionStatus(api.status),
  };
}

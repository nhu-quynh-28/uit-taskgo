import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchTransactionsForAdmin } from "@/lib/api/transactions";
import { transactions as seedTransactions, type Transaction } from "@/lib/mock-data";

export function useTransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransactionsForAdmin();
      if (result.source === "api") {
        setTransactions(result.transactions);
      } else {
        setTransactions(seedTransactions);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load transactions";
      setError(message);
      setTransactions(seedTransactions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    transactions,
    loading,
    error,
    reload: load,
  };
}

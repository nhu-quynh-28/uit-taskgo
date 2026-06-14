import type { EarningsSummaryDTO } from "../api/earnings";
import type { Transaction } from "@/screens/taskerData";

function formatEarningDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function earningsSummaryToTransactions(summary: EarningsSummaryDTO): Transaction[] {
  return summary.records.map((r) => ({
    id: r.id,
    date: formatEarningDate(r.createdAt),
    customer: "Customer",
    service: `Order ${r.orderId.slice(0, 8)}`,
    gross: Number(r.gross) || 0,
    commission: Number(r.platformFee) || 0,
    net: Number(r.taskerNet) || 0,
    type: "service" as const,
  }));
}

export function earningsSummaryToWeeklyChart(summary: EarningsSummaryDTO): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  for (const r of summary.records) {
    if (!r.createdAt) continue;
    const d = new Date(r.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const day = d.getDay();
    const idx = day === 0 ? 6 : day - 1;
    buckets[idx] += Number(r.taskerNet) || 0;
  }
  return buckets.map((n) => Math.round(n));
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useTransactionsList } from "@/hooks/use-transactions-list";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/transactions/")({
  component: TransactionsPage,
  head: () => ({ meta: [{ title: "Transactions — TaskGo Admin" }] }),
});

function TransactionsPage() {
  const { transactions, loading, error } = useTransactionsList();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (type === "all" || t.type === type) &&
          (t.id.toLowerCase().includes(q.toLowerCase()) ||
            t.party.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, type, transactions],
  );

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={loading ? "Loading ledger…" : `${transactions.length} ledger entries`}
      />
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 rounded-xl bg-muted/40 border-transparent"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full lg:w-44 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, row) => (
                    <TableRow key={`loading-${row}`}>
                      {Array.from({ length: 6 }).map((__, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full max-w-[8rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      {transactions.length === 0
                        ? "No transactions yet."
                        : "No transactions match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.date}</TableCell>
                      <TableCell>{t.party}</TableCell>
                      <TableCell><StatusBadge status={t.type} /></TableCell>
                      <TableCell className="font-semibold">${t.amount.toFixed(2)}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

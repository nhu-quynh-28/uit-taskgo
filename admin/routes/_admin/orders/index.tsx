import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, ArrowUpDown } from "lucide-react";
import { useOrdersList } from "@/hooks/use-orders-list";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const { orders, loading, error } = useOrdersList();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  const [tab, setTab] = useState("all");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let r = orders.filter((o) =>
      (tab === "all" || o.status === tab) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase()) || o.tasker.toLowerCase().includes(q.toLowerCase())),
    );
    r = [...r].sort((a, b) => sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount);
    return r;
  }, [q, tab, sortDir, orders]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader title="Orders" subtitle={loading ? "Loading bookings…" : `${orders.length} bookings`} />
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
            <TabsList className="rounded-xl flex-wrap h-auto">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
              <TabsTrigger value="ongoing" className="rounded-lg">Ongoing</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-lg">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 rounded-xl bg-muted/40 border-transparent" />
            </div>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as "asc"|"desc")}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Amount: High to Low</SelectItem>
                <SelectItem value="asc">Amount: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tasker</TableHead>
                  <TableHead className="hidden md:table-cell">Service</TableHead>
                  <TableHead><button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="inline-flex items-center gap-1 font-semibold">Amount <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, row) => (
                    <TableRow key={`loading-${row}`}>
                      {Array.from({ length: 9 }).map((__, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full max-w-[8rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No orders match your filters.
                    </TableCell>
                  </TableRow>
                ) : paginated.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/30 cursor-pointer">
                    <TableCell className="font-mono text-xs font-semibold">{o.id}</TableCell>
                    <TableCell>{o.customer}</TableCell>
                    <TableCell>{o.tasker}</TableCell>
                    <TableCell className="hidden md:table-cell"><span className="px-2 py-1 rounded-full bg-accent/40 text-xs">{o.service}</span></TableCell>
                    <TableCell className="font-semibold">${o.amount}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell><StatusBadge status={o.payment} /></TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{o.date}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon" className="rounded-xl"><Link to="/orders/$id" params={{ id: o.id }}><Eye className="h-4 w-4" /></Link></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Page {page} of {pageCount} · {filtered.length} results</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" disabled={loading || page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" className="rounded-xl" disabled={loading || page === pageCount} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

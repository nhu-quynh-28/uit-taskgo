import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Eye } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — TaskGo Admin" }] }),
});

function DashboardPage() {
  const { stats, recentOrders, loading, error } = useDashboardData();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your marketplace" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={`stat-sk-${i}`} className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-5 w-28" />
                </CardContent>
              </Card>
            ))
          : stats.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                delta={s.delta}
                icon={s.icon}
                tint={s.tint}
              />
            ))}
      </div>

      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent orders</h2>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/orders">View all</Link>
            </Button>
          </div>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, row) => (
                    <TableRow key={`order-sk-${row}`}>
                      {Array.from({ length: 5 }).map((__, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full max-w-[8rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No recent orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold">{o.id}</TableCell>
                      <TableCell>{o.customer}</TableCell>
                      <TableCell className="font-semibold">${o.amount}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" className="rounded-xl">
                          <Link to="/orders/$id" params={{ id: o.id }}><Eye className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link to="/customers">Customers</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link to="/taskers">Taskers</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link to="/complaints">Complaints</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye } from "lucide-react";
import { useCustomersList } from "@/hooks/use-customers-list";
import { getInitial } from "@/lib/format";
import { toast } from "sonner";
import type { AccountStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/customers/")({
  component: CustomersPage,
  head: () => ({ meta: [{ title: "Customers — TaskGo Admin" }] }),
});

function CustomersPage() {
  const { customers, loading, error, setCustomerStatus } = useCustomersList();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          (status === "all" || c.status === status) &&
          (c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.email.toLowerCase().includes(q.toLowerCase()) ||
            c.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, status, customers],
  );

  const toggleBlock = async (id: string, name: string, current: AccountStatus) => {
    const next = current === "active" ? "blocked" : "active";
    try {
      await setCustomerStatus(id, next);
      toast.success(next === "blocked" ? `${name} has been blocked` : `${name} has been unblocked`);
    } catch {
      toast.error("Failed to update customer status");
    }
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle={loading ? "Loading customers…" : `${customers.length} registered customers`} />
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 rounded-xl bg-muted/40 border-transparent"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full lg:w-44 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      {customers.length === 0 ? "No customers registered yet." : "No customers match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className={c.status === "blocked" ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/30"}
                    >
                      <TableCell>
                        <Link to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={c.avatar} />
                            <AvatarFallback>{getInitial(c.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.id}</div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{c.email}</TableCell>
                      <TableCell>{c.orders}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{c.joined}</TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => toggleBlock(c.id, c.name, c.status)}
                          >
                            {c.status === "active" ? "Block" : "Unblock"}
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="rounded-xl">
                            <Link to="/customers/$id" params={{ id: c.id }}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
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

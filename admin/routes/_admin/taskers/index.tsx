import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, Eye, Star } from "lucide-react";
import { useTaskersList } from "@/hooks/use-taskers-list";
import { getInitial } from "@/lib/format";
import { toast } from "sonner";
import type { AccountStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/taskers/")({
  component: TaskersPage,
  head: () => ({ meta: [{ title: "Taskers — TaskGo Admin" }] }),
});

function TaskersPage() {
  const { taskers, loading, error, setTaskerStatus } = useTaskersList();
  const [q, setQ] = useState("");
  const [verif, setVerif] = useState("all");
  const [cat, setCat] = useState("all");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const categories = Array.from(new Set(taskers.map((t) => t.category)));

  const filtered = useMemo(() => {
    let r = taskers.filter((t) =>
      (verif === "all" || t.verified === verif) &&
      (cat === "all" || t.category === cat) &&
      (t.name.toLowerCase().includes(q.toLowerCase()) || t.id.toLowerCase().includes(q.toLowerCase())),
    );
    r = [...r].sort((a, b) => sortDir === "asc" ? a.rating - b.rating : b.rating - a.rating);
    return r;
  }, [q, verif, cat, sortDir, taskers]);

  const toggleBlock = async (id: string, name: string, current: AccountStatus) => {
    const next = current === "active" ? "blocked" : "active";
    try {
      await setTaskerStatus(id, next);
      toast.success(next === "blocked" ? `${name} has been blocked` : `${name} has been unblocked`);
    } catch {
      toast.error("Failed to update tasker status");
    }
  };

  return (
    <div>
      <PageHeader title="Taskers" subtitle={loading ? "Loading taskers…" : `${taskers.length} registered taskers`} />
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search taskers…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 rounded-xl bg-muted/40 border-transparent" />
            </div>
            <Select value={verif} onValueChange={setVerif}>
              <SelectTrigger className="w-full lg:w-44 rounded-xl"><SelectValue placeholder="Verification" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-full lg:w-44 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Tasker</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead><button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="inline-flex items-center gap-1 font-semibold">Rating <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                  <TableHead className="hidden md:table-cell">Jobs</TableHead>
                  <TableHead className="hidden md:table-cell">Earnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, row) => (
                    <TableRow key={`loading-${row}`}>
                      {Array.from({ length: 8 }).map((__, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full max-w-[8rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      {taskers.length === 0 ? "No taskers registered yet." : "No taskers match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    className={t.status === "blocked" ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/30"}
                  >
                    <TableCell>
                      <Link to="/taskers/$id" params={{ id: t.id }} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={t.avatar} /><AvatarFallback>{getInitial(t.name)}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.id}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell><span className="px-2.5 py-1 rounded-full bg-accent/40 text-accent-foreground text-xs font-medium">{t.category}</span></TableCell>
                    <TableCell><div className="flex items-center gap-1 font-medium"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{t.rating}</div></TableCell>
                    <TableCell className="hidden md:table-cell">{t.jobs}</TableCell>
                    <TableCell className="hidden md:table-cell">${t.earnings.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={t.status} />
                        <StatusBadge status={t.online ? "online" : "offline"} />
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={t.verified} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => toggleBlock(t.id, t.name, t.status)}
                        >
                          {t.status === "active" ? "Block" : "Unblock"}
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="rounded-xl">
                          <Link to="/taskers/$id" params={{ id: t.id }}><Eye className="h-4 w-4" /></Link>
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

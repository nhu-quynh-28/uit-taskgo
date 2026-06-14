import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye } from "lucide-react";
import { useComplaintsList } from "@/hooks/use-complaints-list";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/complaints/")({
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const { complaints, loading, error } = useComplaintsList();
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const filtered = useMemo(
    () =>
      complaints.filter(
        (c) =>
          (priority === "all" || c.priority === priority) &&
          (status === "all" || c.status === status) &&
          (c.subject.toLowerCase().includes(q.toLowerCase()) ||
            c.id.toLowerCase().includes(q.toLowerCase()) ||
            c.customer.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, priority, status, complaints],
  );

  return (
    <div>
      <PageHeader
        title="Complaints"
        subtitle={loading ? "Loading complaints…" : `${complaints.length} tickets`}
      />
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search complaints…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 rounded-xl bg-muted/40 border-transparent" />
            </div>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full lg:w-44 rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full lg:w-44 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                  <TableHead className="text-right">Action</TableHead>
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
                      {complaints.length === 0
                        ? "No complaints yet."
                        : "No complaints match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.subject}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.customer}</TableCell>
                      <TableCell className="hidden md:table-cell"><span className="px-2 py-1 rounded-full bg-accent/40 text-xs">{c.category}</span></TableCell>
                      <TableCell><StatusBadge status={c.priority} /></TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{c.assigned}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" className="rounded-xl"><Link to="/complaints/$id" params={{ id: c.id }}><Eye className="h-4 w-4" /></Link></Button>
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

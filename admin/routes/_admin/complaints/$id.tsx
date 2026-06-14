import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Image as ImageIcon, AlertTriangle, Check } from "lucide-react";
import { useComplaintDetail } from "@/hooks/use-complaint-detail";
import { getInitial } from "@/lib/format";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/complaints/$id")({
  component: ComplaintDetail,
  notFoundComponent: () => <div className="p-8">Complaint not found</div>,
});

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { complaint: c, loading, error, notFound, updateComplaint } = useComplaintDetail(id);
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState("");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 rounded-xl mb-4" />
        <Skeleton className="h-10 w-2/3 max-w-lg mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !c) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Complaint not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/complaints">Back to complaints</Link>
        </Button>
      </div>
    );
  }

  const status = c.status;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
        <Link to="/complaints"><ArrowLeft className="h-4 w-4 mr-1" />Back to complaints</Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{c.subject}</h1>
          <p className="text-sm text-muted-foreground">{c.id} · {c.category} · {c.date}</p>
        </div>
        <div className="flex gap-2"><StatusBadge status={c.priority} /><StatusBadge status={status} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { t: "Complaint filed", d: c.date + " · 09:12" },
                { t: "Auto-assigned to " + c.assigned, d: c.date + " · 09:14" },
                { t: "Tasker contacted", d: c.date + " · 10:30" },
                { t: "Awaiting customer response", d: "Today" },
              ].map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <div className="flex-1 flex justify-between"><span>{e.t}</span><span className="text-xs text-muted-foreground">{e.d}</span></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center"><ImageIcon className="h-8 w-8 text-primary/60" /></div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Chat history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { from: "customer", text: "The tasker damaged my couch during the move." },
                { from: "tasker", text: "I'm sorry, the strap broke unexpectedly." },
                { from: "customer", text: "I'd like a partial refund please." },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.from === "customer" ? "justify-end" : ""}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${m.from === "customer" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.text}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Admin notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal note…" className="rounded-xl min-h-24" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Final decision</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose outcome…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund">Full refund to customer</SelectItem>
                  <SelectItem value="partial">Partial refund</SelectItem>
                  <SelectItem value="warning">Warning to tasker</SelectItem>
                  <SelectItem value="suspend">Suspend tasker</SelectItem>
                  <SelectItem value="dismiss">Dismiss complaint</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      await updateComplaint({ status: "resolved", adminNotes: notes });
                      toast.success("Complaint resolved");
                    } catch {
                      toast.error("Failed to resolve complaint");
                    }
                  }}
                  className="flex-1 rounded-xl bg-success hover:bg-success/90 text-primary-foreground"
                >
                  <Check className="h-4 w-4 mr-1" />Resolve
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await updateComplaint({ status: "escalated", adminNotes: notes });
                      toast.error("Complaint escalated");
                    } catch {
                      toast.error("Failed to escalate complaint");
                    }
                  }}
                  variant="destructive"
                  className="flex-1 rounded-xl"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />Escalate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.customer}`} /><AvatarFallback>{getInitial(c.customer)}</AvatarFallback></Avatar>
              <div><p className="font-medium">{c.customer}</p><p className="text-xs text-muted-foreground">Plaintiff</p></div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Tasker</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.tasker}`} /><AvatarFallback>{getInitial(c.tasker)}</AvatarFallback></Avatar>
              <div><p className="font-medium">{c.tasker}</p><p className="text-xs text-muted-foreground">Respondent</p></div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
            <CardContent>
              <Select
                value={status}
                onValueChange={async (v) => {
                  try {
                    await updateComplaint({ status: v as typeof c.status, adminNotes: notes });
                    toast.success("Status updated");
                  } catch {
                    toast.error("Failed to update status");
                  }
                }}
              >
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

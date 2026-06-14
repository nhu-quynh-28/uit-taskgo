import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/20",
  online: "bg-success/15 text-success border-success/20",
  verified: "bg-success/15 text-success border-success/20",
  completed: "bg-success/15 text-success border-success/20",
  paid: "bg-success/15 text-success border-success/20",
  success: "bg-success/15 text-success border-success/20",
  resolved: "bg-success/15 text-success border-success/20",
  approved: "bg-success/15 text-success border-success/20",

  pending: "bg-warning/15 text-warning border-warning/20",
  ongoing: "bg-info/15 text-info border-info/20",
  "in-progress": "bg-info/15 text-info border-info/20",
  unpaid: "bg-warning/15 text-warning border-warning/20",
  medium: "bg-warning/15 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",

  high: "bg-destructive/10 text-destructive border-destructive/20",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  blocked: "bg-destructive/10 text-destructive border-destructive/20",
  escalated: "bg-destructive/15 text-destructive border-destructive/30",

  refunded: "bg-muted text-muted-foreground border-border",
  open: "bg-info/15 text-info border-info/20",
  offline: "bg-muted text-muted-foreground border-border",
  payment: "bg-info/15 text-info border-info/20",
  commission: "bg-accent/40 text-accent-foreground border-accent",
  withdrawal: "bg-warning/15 text-warning border-warning/20",
  refund: "bg-muted text-muted-foreground border-border",
  payout: "bg-accent/40 text-accent-foreground border-accent",
  bonus: "bg-info/15 text-info border-info/20",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium capitalize border",
        styles[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {status.replace("-", " ")}
    </Badge>
  );
}

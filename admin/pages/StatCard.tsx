import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tint = "primary",
}: {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tint?: "primary" | "accent" | "info" | "warning";
}) {
  const tintMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent text-accent-foreground",
    info: "bg-info/15 text-info",
    warning: "bg-warning/15 text-warning",
  };
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {delta !== undefined && (
              <div className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? "+" : ""}{delta}% vs last week
              </div>
            )}
          </div>
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", tintMap[tint])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

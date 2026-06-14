import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { revenueChartData } from "@/lib/mock-data";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  orders: { label: "Orders", color: "hsl(var(--info))" },
};

export const Route = createFileRoute("/_admin/reports/")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — TaskGo Admin" }] }),
});

function ReportsPage() {
  const { revenueChart, loading } = useDashboardData();
  const chartData = revenueChart.length > 0 ? revenueChart : revenueChartData;

  return (
    <div>
      <PageHeader title="Reports" subtitle="Revenue and booking trends" />
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Monthly revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[320px] w-full rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
              No revenue data available yet.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[320px] w-full min-w-0">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

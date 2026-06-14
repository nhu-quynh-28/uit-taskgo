import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageCircle, MapPin, Clock, Check } from "lucide-react";
import type { OrderStatus } from "@/lib/mock-data";
import { useOrderDetail } from "@/hooks/use-order-detail";
import { getInitial } from "@/lib/format";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_admin/orders/$id")({
  component: OrderDetail,
  notFoundComponent: () => <div className="p-8">Order not found</div>,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { order, loading, error, notFound } = useOrderDetail(id);
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    setLocalStatus(null);
  }, [order?.id]);

  if (loading) {
    return (
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
          <Link to="/orders">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to orders
          </Link>
        </Button>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-40 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const status = localStatus ?? order.status;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
        <Link to="/orders"><ArrowLeft className="h-4 w-4 mr-1" />Back to orders</Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order {order.id}</h1>
          <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
        </div>
        <div className="flex gap-2 items-center">
          <StatusBadge status={status} />
          <StatusBadge status={order.payment} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Service timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { t: "Order placed", d: order.date + " · 09:12", done: true },
                { t: "Tasker assigned", d: order.date + " · 09:25", done: true },
                { t: "Tasker en route", d: order.date + " · 10:48", done: true },
                { t: "Service in progress", d: order.date + " · 11:10", done: status === "ongoing" || status === "completed" },
                { t: "Completed", d: "—", done: status === "completed" },
              ].map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${e.done ? "bg-success text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {e.done ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    {i < 4 && <div className={`w-px flex-1 ${e.done ? "bg-success/50" : "bg-border"} mt-1`} />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">{e.t}</p>
                    <p className="text-xs text-muted-foreground">{e.d}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chat preview</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { from: "customer", text: "Hi, how long until you arrive?" },
                { from: "tasker", text: "Hey! Around 15 minutes. Almost there." },
                { from: "customer", text: "Perfect, thanks!" },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.from === "customer" ? "justify-end" : ""}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${m.from === "customer" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Admin actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-center">
              <Select
                value={status}
                onValueChange={(v) => {
                  setLocalStatus(v as OrderStatus);
                  toast.success(`Order status updated to ${v}`);
                }}
              >
                <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Refund initiated")}>Issue refund</Button>
              <Button variant="destructive" className="rounded-xl" onClick={() => toast.error("Order cancelled")}>Cancel order</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.customer}`} /><AvatarFallback>{getInitial(order.customer)}</AvatarFallback></Avatar>
                <div><p className="font-medium">{order.customer}</p><p className="text-xs text-muted-foreground">Customer</p></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{order.address}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Tasker</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.tasker}`} /><AvatarFallback>{getInitial(order.tasker)}</AvatarFallback></Avatar>
                <div><p className="font-medium">{order.tasker}</p><p className="text-xs text-muted-foreground">{order.service}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Payment summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${(order.amount * 0.85).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span>${(order.amount * 0.1).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${(order.amount * 0.05).toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>${order.amount}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

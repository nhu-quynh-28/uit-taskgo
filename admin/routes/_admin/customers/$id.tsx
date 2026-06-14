import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useCustomerDetail } from "@/hooks/use-customer-detail";
import { getInitial } from "@/lib/format";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_admin/customers/$id")({
  component: CustomerDetail,
  notFoundComponent: () => <div className="p-8">Customer not found</div>,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const { customer, customerOrders, loading, error, notFound, setCustomerStatus } =
    useCustomerDetail(id);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (loading) {
    return (
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
          <Link to="/customers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to customers
          </Link>
        </Button>
        <Skeleton className="h-32 w-full rounded-2xl mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/customers">Back to customers</Link>
        </Button>
      </div>
    );
  }

  const isBlocked = customer.status === "blocked";

  const toggleBlock = async () => {
    const next = isBlocked ? "active" : "blocked";
    try {
      await setCustomerStatus(next);
      toast.success(
        next === "blocked" ? `${customer.name} has been blocked` : `${customer.name} has been unblocked`,
      );
    } catch {
      toast.error("Failed to update customer status");
    }
  };

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
        <Link to="/customers">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to customers
        </Link>
      </Button>

      {isBlocked && (
        <Alert variant="destructive" className="mb-4 rounded-xl border-destructive/30 bg-destructive/10">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            This customer account is blocked. They cannot place new orders until unblocked.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)] mb-6">
        <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={customer.avatar} />
            <AvatarFallback>{getInitial(customer.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
            <div className="mt-2 flex gap-2">
              <StatusBadge status={customer.status} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Phone:</span> {customer.phone}
              </p>
              <p>
                <span className="text-muted-foreground">Joined:</span> {customer.joined}
              </p>
              <p>
                <span className="text-muted-foreground">Total orders:</span> {customer.orders}
              </p>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={toggleBlock}>
              {isBlocked ? "Unblock customer" : "Block customer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Order</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  customerOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell>{o.service}</TableCell>
                      <TableCell>${o.amount}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Save } from "lucide-react";
import {
  serviceToDetailForm,
  useServiceDetail,
  type ServiceDetailForm,
} from "@/hooks/use-service-detail";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/services/$id")({
  component: ServiceDetail,
  notFoundComponent: () => <div className="p-8">Service not found</div>,
});

function ServiceDetail() {
  const { id } = Route.useParams();
  const { service, services, loading, error, notFound, saveService } = useServiceDetail(id);

  const [form, setForm] = useState<ServiceDetailForm>({
    name: "",
    category: "",
    price: 0,
    active: true,
    description: "",
    duration: "60",
  });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!service) return;
    setForm(serviceToDetailForm(service));
  }, [service, id]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-9 w-40 rounded-xl mb-4" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Service not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/services">Back to services</Link>
        </Button>
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveService({
        name: form.name,
        category: form.category,
        price: form.price,
        active: form.active,
        description: form.description,
        duration: form.duration,
      });
      toast.success("Service saved successfully");
    } catch {
      toast.error("Failed to save service");
    }
  };

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
        <Link to="/services"><ArrowLeft className="h-4 w-4 mr-1" />Back to services</Link>
      </Button>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Service information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Service name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-11" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => <SelectItem key={s.id} value={s.category}>{s.icon} {s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl min-h-32" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Service images</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-accent to-secondary" />
                ))}
                <button type="button" className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/40 transition">
                  <Upload className="h-6 w-6" />
                  <span className="text-xs mt-1">Upload</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Base price ($)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="rounded-xl h-11" /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="rounded-xl h-11" /></div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              <div className="flex items-center justify-between"><Label>Featured</Label><Switch /></div>
              <div className="flex items-center justify-between"><Label>Weekends</Label><Switch defaultChecked /></div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full rounded-xl h-11"><Save className="h-4 w-4 mr-1" />Save changes</Button>
        </div>
      </form>
    </div>
  );
}

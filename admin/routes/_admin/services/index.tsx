import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import type { Service } from "@/lib/mock-data";
import { useServicesList } from "@/hooks/use-services-list";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/services/")({
  component: ServicesPage,
  head: () => ({ meta: [{ title: "Services — TaskGo Admin" }] }),
});

function ServicesPage() {
  const {
    services: data,
    loading,
    error,
    toggleActive,
    createService,
    saveService,
    deleteService,
  } = useServicesList();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", icon: "🧩", price: 50, description: "" });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const toggle = async (s: Service) => {
    try {
      const updated = await toggleActive(s);
      toast.success(`${updated.name} ${updated.active ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update service");
    }
  };

  const create = async () => {
    try {
      await createService(form);
      toast.success("Category created");
      setOpen(false);
      setForm({ name: "", icon: "🧩", price: 50, description: "" });
    } catch {
      toast.error("Failed to create service");
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await saveService(editing);
      toast.success("Category updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update service");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteService(deleting.id);
      toast.success("Category deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete service");
    }
  };

  return (
    <div>
      <PageHeader
        title="Service Categories"
        subtitle={loading ? "Loading categories…" : `${data.length} categories`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl"><Plus className="h-4 w-4 mr-1" />New category</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Create category</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Base price ($)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="rounded-xl" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              </div>
              <DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button><Button className="rounded-xl" onClick={create}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={`sk-${i}`} className="rounded-2xl border-border/60">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : data.length === 0 ? (
          <Card className="rounded-2xl border-border/60 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <CardContent className="p-10 text-center text-muted-foreground">
              No service categories yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          data.map((s) => (
            <Card key={s.id} className="rounded-2xl border-border/60 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center text-3xl">{s.icon}</div>
                  <Switch checked={s.active} onCheckedChange={() => toggle(s)} />
                </div>
                <h3 className="mt-4 font-bold text-lg">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-bold">${s.price}</p>
                  </div>
                  <StatusBadge status={s.active ? "active" : "offline"} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">{s.count} services</span>
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                      <Link to="/services/$id" params={{ id: s.id }}><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Edit category</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Icon</Label><Input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Price</Label><Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: +e.target.value })} className="rounded-xl" /></div>
              <div><Label>Description</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="rounded-xl" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button><Button className="rounded-xl" onClick={saveEdit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>This will remove {deleting?.name} and all its associated services. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

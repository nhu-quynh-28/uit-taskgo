import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/settings/")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — TaskGo Admin" }] }),
});

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Admin console preferences" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display name</Label>
              <Input defaultValue="Sara Admin" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue="admin@taskgo.app" className="rounded-xl mt-1" />
            </div>
            <Button className="rounded-xl" onClick={() => toast.success("Profile saved")}>
              Save profile
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Extra security for admin login</p>
              </div>
              <Switch />
            </div>
            <Button variant="outline" className="rounded-xl w-full" onClick={() => toast.info("Password reset email sent")}>
              Send password reset link
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { topbarNotifications } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/notifications/")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — TaskGo Admin" }] }),
});

function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" subtitle="System alerts and activity" />
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-6 divide-y">
          {topbarNotifications.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground text-sm">No notifications yet.</p>
          ) : (
            topbarNotifications.map((n) => (
              <div key={n.title} className="py-4 first:pt-0 last:pb-0">
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

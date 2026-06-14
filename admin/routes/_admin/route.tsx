import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Topbar } from "@/components/admin/Topbar";
import { getAuthToken } from "@/lib/api/client";

export const Route = createFileRoute("/_admin")({
  beforeLoad: () => {
    if (!getAuthToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <Topbar />
        <div className="flex flex-1 flex-col min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

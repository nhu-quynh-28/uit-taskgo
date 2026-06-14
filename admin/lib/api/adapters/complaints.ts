import { format } from "date-fns";
import type { Complaint } from "@/lib/mock-data";

/** Expected shape when GET /complaints is implemented. */
export type ApiComplaint = {
  id: string;
  subject: string;
  customerId?: string;
  customerName?: string;
  customer?: string;
  taskerId?: string;
  taskerName?: string;
  tasker?: string;
  priority?: string;
  status?: string;
  category?: string;
  createdAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  assigned?: string;
};

const DEFAULT_ASSIGNED = "Admin Team";

function mapPriority(priority?: string): Complaint["priority"] {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "urgent";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "medium";
  }
}

function mapStatus(status?: string): Complaint["status"] {
  switch (status?.toLowerCase()) {
    case "open":
      return "open";
    case "in-progress":
    case "in_progress":
    case "inprogress":
      return "in-progress";
    case "resolved":
      return "resolved";
    case "escalated":
      return "escalated";
    default:
      return "open";
  }
}

function formatComplaintDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function mapApiComplaintToComplaint(api: ApiComplaint): Complaint {
  return {
    id: api.id,
    subject: api.subject,
    customer: api.customerName ?? api.customer ?? "—",
    tasker: api.taskerName ?? api.tasker ?? "—",
    priority: mapPriority(api.priority),
    status: mapStatus(api.status),
    category: api.category?.trim() || "General",
    date: formatComplaintDate(api.createdAt),
    assigned: api.assignedToName ?? api.assigned ?? api.assignedTo ?? DEFAULT_ASSIGNED,
  };
}

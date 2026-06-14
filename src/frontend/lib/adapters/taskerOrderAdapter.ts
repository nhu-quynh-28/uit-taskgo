import type { OrderDTO, UserDTO } from "@/lib/api/types";
import type { Order } from "@/screens/AppContext";
import type { ActiveJob, JobRequest } from "@/screens/taskerData";

export type CustomerStub = {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  address: string;
  notes?: string;
};

/** Tasker job list item — includes API status for history tabs */
export type TaskerJob = ActiveJob & {
  apiStatus: string;
  isTerminal: boolean;
  totalEarning: number;
  /** ISO timestamp for list sorting */
  sortKey: string;
};

export function userDtoToCustomerStub(dto: UserDTO, orderAddress: string, notes?: string): CustomerStub {
  return {
    id: dto.id,
    name: dto.name,
    avatar: dto.avatar ?? "https://i.pravatar.cc/120?img=12",
    phone: dto.phone ?? "",
    address: orderAddress,
    notes,
  };
}

export function fallbackCustomerStub(
  customerId: string | undefined,
  orderAddress: string,
  notes?: string,
): CustomerStub {
  return {
    id: customerId ?? "",
    name: "Customer",
    avatar: "https://i.pravatar.cc/120?img=12",
    phone: "",
    address: orderAddress,
    notes,
  };
}

function formatScheduledLabel(scheduledAt?: string): string {
  if (!scheduledAt) return "—";
  try {
    const d = new Date(scheduledAt);
    if (Number.isNaN(d.getTime())) return scheduledAt;
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const isToday = new Date().toDateString() === d.toDateString();
    return isToday ? `Today, ${time}` : `${date}, ${time}`;
  } catch {
    return scheduledAt;
  }
}

function distanceKm(
  from?: { lat: number; lng: number },
  to?: { lat: number; lng: number },
): number {
  if (!from || !to) return 0;
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

/** Backend FSM → tasker job card status */
export type TaskerStatusAction = {
  action: "arrive" | "start" | "complete";
  label: string;
};

/** Next tasker FSM step from backend order.status */
export function getNextTaskerStatusAction(
  apiStatus: string | undefined,
): TaskerStatusAction | null {
  switch (apiStatus) {
    case "accepted":
      return { action: "arrive", label: "Mark Arrived" };
    case "arrived":
      return { action: "start", label: "Start Job" };
    case "in_progress":
      return { action: "complete", label: "Complete Job" };
    default:
      return null;
  }
}

export function taskerStatusBlockedMessage(apiStatus: string | undefined): string | null {
  if (apiStatus === "pending_payment") {
    return "Customer payment is pending. Status updates unlock once payment succeeds.";
  }
  if (apiStatus === "pending") {
    return "Accept this job before updating its status.";
  }
  return null;
}

export function apiStatusToTaskerJobStatus(
  apiStatus: string | undefined,
): ActiveJob["status"] | null {
  switch (apiStatus) {
    case "pending":
    case "pending_payment":
      return "pending";
    case "accepted":
      return "accepted";
    case "arrived":
      return "arrived";
    case "in_progress":
      return "working";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
}

export function orderToJobRequest(
  order: Order,
  customer: CustomerStub,
  taskerLocation?: { lat: number; lng: number },
): JobRequest {
  return {
    id: order.id,
    customer: {
      ...customer,
      // Always render the address from the current order payload
      // to avoid stale cached customer addresses across bookings.
      address: order.address,
      notes: order.notes ?? customer.notes,
    },
    service: order.service.name,
    distanceKm: distanceKm(taskerLocation, order.location),
    durationEst: order.service.duration ?? "—",
    earnings: order.subtotal ?? order.service.price,
    scheduledAt: formatScheduledLabel(order.scheduledAt),
    description: order.notes ?? "",
    photos: [],
    countdown: 0,
  };
}

function buildProgress(order: Order): ActiveJob["progress"] {
  const steps: ActiveJob["progress"] = [];
  const t = order.acceptedAt
    ? new Date(order.acceptedAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  if (order.apiStatus && ["accepted", "arrived", "in_progress", "completed"].includes(order.apiStatus)) {
    steps.push({ step: "Accepted", time: t });
  }
  if (order.apiStatus && ["arrived", "in_progress", "completed"].includes(order.apiStatus)) {
    steps.push({ step: "Arrived", time: t });
  }
  if (order.apiStatus && ["in_progress", "completed"].includes(order.apiStatus)) {
    steps.push({ step: "Working", time: t });
  }
  if (order.apiStatus === "completed") {
    steps.push({ step: "Completed", time: t });
  }
  return steps;
}

function resolveTotalEarning(order: Order): number {
  return Number(order.pricing?.total ?? order.subtotal ?? order.service.price ?? 0);
}

export function orderToTaskerJob(
  order: Order,
  customer: CustomerStub,
  taskerLocation?: { lat: number; lng: number },
): TaskerJob | null {
  const apiStatus = order.apiStatus ?? "";
  const status = apiStatusToTaskerJobStatus(apiStatus);
  if (!status) return null;

  const acceptedTime = order.acceptedAt
    ? new Date(order.acceptedAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const isTerminal = apiStatus === "completed" || apiStatus === "cancelled";

  return {
    ...orderToJobRequest(order, customer, taskerLocation),
    status,
    acceptedAt: acceptedTime,
    progress: buildProgress(order),
    apiStatus,
    isTerminal,
    totalEarning: resolveTotalEarning(order),
    sortKey: order.scheduledAt ?? order.updatedAt ?? order.acceptedAt ?? "",
  };
}

/** @deprecated Use orderToTaskerJob */
export function orderToActiveJob(
  order: Order,
  customer: CustomerStub,
  taskerLocation?: { lat: number; lng: number },
): ActiveJob | null {
  return orderToTaskerJob(order, customer, taskerLocation);
}

export function isTaskerIncomingOrder(order: Order, taskerId: string | undefined): boolean {
  return order.apiStatus === "pending" && !order.taskerId;
}

/** In-progress jobs for dashboard counts (accepted → in_progress) */
export function isTaskerActiveOrder(order: Order, taskerId: string | undefined): boolean {
  if (!taskerId || order.taskerId !== taskerId) return false;
  return ["accepted", "arrived", "in_progress", "pending_payment"].includes(order.apiStatus ?? "");
}

/** Any order assigned to this tasker (job history) */
export function isTaskerOwnedOrder(order: Order, taskerId: string | undefined): boolean {
  if (!taskerId) return false;
  return order.taskerId === taskerId;
}

export type TaskerJobsTab = "Active" | "Completed" | "Cancelled";

export function filterTaskerJobsForTab(jobs: TaskerJob[], tab: TaskerJobsTab): TaskerJob[] {
  return jobs.filter((job) => {
    const s = job.apiStatus;
    if (tab === "Completed") return s === "completed";
    if (tab === "Cancelled") return s === "cancelled";
    return s !== "completed" && s !== "cancelled";
  });
}

export function sortTaskerJobsBySchedule(jobs: TaskerJob[]): TaskerJob[] {
  return [...jobs].sort((a, b) => {
    const ta = Date.parse(a.sortKey) || 0;
    const tb = Date.parse(b.sortKey) || 0;
    return tb - ta;
  });
}

export function emptyStateMessageForJobsTab(tab: TaskerJobsTab): string {
  switch (tab) {
    case "Completed":
      return "No completed jobs yet";
    case "Cancelled":
      return "No cancelled jobs";
    default:
      return "No active jobs found";
  }
}

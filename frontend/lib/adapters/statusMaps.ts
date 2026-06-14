import type { Order } from "@/screens/AppContext";

export type UiOrderTab = Order["status"];

/** Human-readable label from backend FSM */
export function apiStatusToLabel(apiStatus: string, paymentStatus?: string): string {
  if (apiStatus === "pending_payment" || paymentStatus === "failed") {
    return "payment required";
  }
  switch (apiStatus) {
    case "pending":
      return "finding tasker";
    case "accepted":
      return "upcoming";
    case "arrived":
      return "tasker arrived";
    case "in_progress":
      return "ongoing";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return apiStatus.replace(/_/g, " ");
  }
}

/** Maps API status → orders tab filter */
export function apiStatusToTab(apiStatus: string): UiOrderTab {
  switch (apiStatus) {
    case "pending":
    case "accepted":
      return "upcoming";
    case "arrived":
    case "in_progress":
    case "pending_payment":
      return "ongoing";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "upcoming";
  }
}

export function orderMatchesTab(order: Order, tab: UiOrderTab): boolean {
  return order.status === tab;
}

export function isFindingTasker(apiStatus: string | undefined): boolean {
  return apiStatus === "pending";
}

export function needsPayment(apiStatus: string | undefined, paymentStatus?: string): boolean {
  return apiStatus === "pending_payment" || paymentStatus === "failed";
}

export function canTrack(apiStatus: string | undefined): boolean {
  return ["accepted", "arrived", "in_progress", "pending_payment"].includes(apiStatus ?? "");
}

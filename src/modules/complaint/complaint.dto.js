import { COMPLAINT_STATUS } from "../../config/constants.js";

const STATUS_ALIASES = {
  pending: COMPLAINT_STATUS.OPEN,
  open: COMPLAINT_STATUS.OPEN,
  reviewing: COMPLAINT_STATUS.IN_PROGRESS,
  "in-progress": COMPLAINT_STATUS.IN_PROGRESS,
  in_progress: COMPLAINT_STATUS.IN_PROGRESS,
  resolved: COMPLAINT_STATUS.RESOLVED,
  rejected: COMPLAINT_STATUS.ESCALATED,
  escalated: COMPLAINT_STATUS.ESCALATED,
};

export function normalizeComplaintStatus(input) {
  if (!input) return COMPLAINT_STATUS.OPEN;
  const key = String(input).trim().toLowerCase();
  return STATUS_ALIASES[key] ?? input;
}

export function toComplaintDTO(complaint, names = {}) {
  return {
    id: complaint.id,
    subject: complaint.subject,
    customerId: complaint.customerId,
    customerName: names.customerName,
    customer: names.customerName,
    taskerId: complaint.taskerId,
    taskerName: names.taskerName,
    tasker: names.taskerName,
    orderId: complaint.orderId ?? null,
    category: complaint.category ?? "General",
    priority: complaint.priority,
    status: complaint.status,
    assignedTo: complaint.assignedTo ?? "Admin Team",
    assigned: complaint.assignedTo ?? "Admin Team",
    adminNotes: complaint.adminNotes ?? "",
    resolvedBy: complaint.resolvedBy ?? null,
    resolvedAt: complaint.resolvedAt ?? null,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
  };
}

import type { Complaint } from "@/lib/mock-data";
import { apiRequest } from "./client";
import { mapApiComplaintToComplaint, type ApiComplaint } from "./adapters/complaints";

export type ComplaintStatusUpdate = {
  status: Complaint["status"];
  adminNotes?: string;
  assignedTo?: string;
};

export async function fetchComplaintsForAdmin(): Promise<Complaint[]> {
  const rows = await apiRequest<ApiComplaint[]>("/complaints", { allowLive: true });
  return rows.map(mapApiComplaintToComplaint);
}

export async function fetchComplaintDetailForAdmin(complaintId: string): Promise<Complaint> {
  const row = await apiRequest<ApiComplaint>(`/complaints/${complaintId}`, {
    allowLive: true,
  });
  return mapApiComplaintToComplaint(row);
}

export async function updateComplaintStatusForAdmin(
  complaintId: string,
  body: ComplaintStatusUpdate,
): Promise<Complaint> {
  const row = await apiRequest<ApiComplaint>(`/complaints/${complaintId}/status`, {
    method: "PATCH",
    allowLive: true,
    body: JSON.stringify(body),
  });
  return mapApiComplaintToComplaint(row);
}

export type { ApiComplaint };

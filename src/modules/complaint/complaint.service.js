import { COMPLAINT_STATUS } from "../../config/constants.js";
import { badRequest } from "../../utils/AppError.js";
import { normalizeComplaintStatus, toComplaintDTO } from "./complaint.dto.js";

export function createComplaintService({ complaintRepo, userRepo }) {
  async function resolveNames(complaint) {
    const [customer, tasker] = await Promise.all([
      userRepo.findById(complaint.customerId),
      userRepo.findById(complaint.taskerId),
    ]);
    return {
      customerName: customer?.name ?? "—",
      taskerName: tasker?.name ?? "—",
    };
  }

  async function listComplaints() {
    const rows = await complaintRepo.listAll();
    return Promise.all(
      rows.map(async (row) => toComplaintDTO(row, await resolveNames(row))),
    );
  }

  async function getComplaint(id) {
    const row = await complaintRepo.findByIdOrFail(id);
    return toComplaintDTO(row, await resolveNames(row));
  }

  async function updateStatus(id, actorId, { status, adminNotes, assignedTo }) {
    const normalized = normalizeComplaintStatus(status);
    if (!Object.values(COMPLAINT_STATUS).includes(normalized)) {
      throw badRequest("Invalid complaint status");
    }

    const patch = {
      status: normalized,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(assignedTo !== undefined ? { assignedTo } : {}),
    };

    if (
      normalized === COMPLAINT_STATUS.RESOLVED ||
      normalized === COMPLAINT_STATUS.ESCALATED
    ) {
      patch.resolvedBy = actorId;
      patch.resolvedAt = new Date().toISOString();
    }

    const updated = await complaintRepo.update(id, patch);
    return toComplaintDTO(updated, await resolveNames(updated));
  }

  return { listComplaints, getComplaint, updateStatus };
}

import { apiRequest } from "./client";

export type EarningRecordDTO = {
  id: string;
  orderId: string;
  taskerId: string;
  customerId?: string;
  gross: number;
  platformFee: number;
  taskerNet: number;
  status?: string;
  createdAt?: string;
};

export type EarningsSummaryDTO = {
  taskerId: string;
  totalJobs: number;
  totalNet: number;
  records: EarningRecordDTO[];
};

export async function getMyEarningsRequest(): Promise<EarningsSummaryDTO> {
  const { data } = await apiRequest<EarningsSummaryDTO>("get", "/earnings/me");
  return data;
}

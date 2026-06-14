import { apiRequest } from "./client";

export type ApiService = {
  id: string;
  name: string;
  icon: string;
  category: string;
  description?: string;
  basePrice?: number;
  durationLabel?: string;
  estimatedDurationMinutes?: number | null;
  active?: boolean;
};

export async function listServicesRequest(): Promise<ApiService[]> {
  const { data } = await apiRequest<ApiService[]>("get", "/services");
  return data;
}

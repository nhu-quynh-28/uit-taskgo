import type { Service } from "@/lib/mock-data";
import { apiRequest } from "./client";
import {
  applyCategoryCounts,
  mapApiServiceToService,
  toApiIconKey,
  type ApiService,
} from "./adapters/services";

export type ServiceFormInput = {
  name: string;
  icon: string;
  price: number;
  description: string;
};

export type ServiceUpdateInput = {
  name?: string;
  icon?: string;
  category?: string;
  description?: string;
  basePrice?: number;
  active?: boolean;
  estimatedDurationMinutes?: number | null;
};

export async function fetchServicesForAdmin(): Promise<Service[]> {
  const rows = await apiRequest<ApiService[]>("/services", { allowLive: true });
  return applyCategoryCounts(rows.map((row) => mapApiServiceToService(row)));
}

export async function fetchServiceDetailForAdmin(serviceId: string): Promise<Service> {
  const row = await apiRequest<ApiService>(`/services/${serviceId}`, { allowLive: true });
  return mapApiServiceToService(row);
}

export async function createServiceForAdmin(input: ServiceFormInput): Promise<Service> {
  const name = input.name.trim() || "New Service";
  const row = await apiRequest<ApiService>("/services", {
    method: "POST",
    allowLive: true,
    body: JSON.stringify({
      name,
      icon: toApiIconKey(input.icon),
      category: name,
      description: input.description,
      basePrice: input.price,
      active: true,
    }),
  });
  return mapApiServiceToService(row);
}

export async function updateServiceForAdmin(
  serviceId: string,
  patch: ServiceUpdateInput,
): Promise<Service> {
  const body: ServiceUpdateInput = { ...patch };
  if (patch.icon !== undefined) {
    body.icon = toApiIconKey(patch.icon);
  }
  const row = await apiRequest<ApiService>(`/services/${serviceId}`, {
    method: "PATCH",
    allowLive: true,
    body: JSON.stringify(body),
  });
  return mapApiServiceToService(row);
}

export async function deleteServiceForAdmin(serviceId: string): Promise<void> {
  await apiRequest(`/services/${serviceId}`, { method: "DELETE", allowLive: true });
}

export type { ApiService };

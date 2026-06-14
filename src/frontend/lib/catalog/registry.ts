import type { Service } from "@/screens/data";

let catalogServices: Service[] = [];

export function setCatalogServices(services: Service[]): void {
  catalogServices = services;
}

export function getCatalogServices(): Service[] {
  return catalogServices;
}

export function findCatalogServiceByName(serviceName: string): Service | undefined {
  const key = serviceName.trim().toLowerCase();
  return catalogServices.find((s) => s.name.trim().toLowerCase() === key);
}

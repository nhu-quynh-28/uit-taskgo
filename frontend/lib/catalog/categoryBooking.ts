import {
  filterServicesByCategory,
  type CatalogService,
} from "@/lib/adapters/catalogAdapter";
import { getCategoryById } from "@/lib/constants/categories";

export type CategoryBookingTarget =
  | { kind: "serviceDetail"; service: CatalogService }
  | { kind: "categoryPicker"; services: CatalogService[] };

/**
 * Resolves how to enter the service-first booking flow for a Home category tap.
 */
export function resolveCategoryBookingTarget(
  services: CatalogService[],
  categoryId: string,
): CategoryBookingTarget {
  const matches = filterServicesByCategory(services, categoryId);
  if (matches.length === 1) {
    return { kind: "serviceDetail", service: matches[0] };
  }
  return { kind: "categoryPicker", services: matches };
}

export function categoryHasServices(
  services: CatalogService[],
  categoryId: string,
): boolean {
  return filterServicesByCategory(services, categoryId).length > 0;
}

export function getCategorySummary(categoryId: string): string {
  const cat = getCategoryById(categoryId);
  return cat?.label ?? categoryId;
}

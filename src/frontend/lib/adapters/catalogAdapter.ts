import { Sparkles, Zap } from "lucide-react-native";
import { haversineKm, roundKm, type LatLng } from "@/lib/utils/distance";
import {
  HOME_CATEGORY_GRID,
  TASKGO_CATEGORIES,
  getCategoryById,
} from "@/lib/constants/categories";
import type { Service, Tasker } from "@/screens/data";
import type { ApiService } from "../api/services";
import type { UserDTO } from "../api/types";

const ICON_BY_KEY: Record<string, typeof Sparkles> = Object.fromEntries(
  TASKGO_CATEGORIES.flatMap((c) => [
    [c.id, c.icon],
    ...c.iconKeys.filter((k) => k !== c.id).map((k) => [k, c.icon]),
  ]),
) as Record<string, typeof Sparkles>;

ICON_BY_KEY.home = TASKGO_CATEGORIES.find((c) => c.id === "cleaning")!.icon;
ICON_BY_KEY.outdoor = TASKGO_CATEGORIES.find((c) => c.id === "gardening")!.icon;
ICON_BY_KEY.repair = TASKGO_CATEGORIES.find((c) => c.id === "plumbing")!.icon;
ICON_BY_KEY.electrical = Zap;

const COLOR_BY_KEY: Record<string, string> = {
  cleaning: "bg-emerald-50",
  plumbing: "bg-blue-50",
  painting: "bg-amber-50",
  moving: "bg-rose-50",
  handyman: "bg-orange-50",
  gardening: "bg-lime-50",
  ac: "bg-cyan-50",
  electric: "bg-yellow-50",
  laundry: "bg-indigo-50",
  home: "bg-emerald-50",
  outdoor: "bg-lime-50",
  repair: "bg-blue-50",
};

export type CatalogService = Service & {
  apiCategory: string;
  apiIconKey: string;
  estimatedDurationMinutes?: number | null;
};

function resolveIcon(iconOrCategory: string): typeof Sparkles {
  const key = iconOrCategory.trim().toLowerCase();
  return ICON_BY_KEY[key] ?? Sparkles;
}

function resolveColor(category: string): string {
  const key = category.trim().toLowerCase();
  return COLOR_BY_KEY[key] ?? "bg-emerald-50";
}

export function apiServiceToService(api: ApiService): CatalogService {
  const category = (api.category?.trim() || "home").toLowerCase();
  const iconKey = (api.icon?.trim() || category).toLowerCase();
  return {
    id: api.id,
    name: api.name,
    icon: resolveIcon(iconKey),
    color: resolveColor(category),
    price: Number(api.basePrice) || 0,
    duration: api.durationLabel?.trim() || "—",
    estimatedDurationMinutes: api.estimatedDurationMinutes ?? null,
    description: api.description?.trim() ?? "",
    includes: [],
    rating: 4.8,
    reviews: 0,
    apiCategory: category,
    apiIconKey: iconKey,
  };
}

export function serviceMatchesCategory(
  service: CatalogService,
  categoryId?: string,
): boolean {
  if (!categoryId) return true;
  const cat = getCategoryById(categoryId);
  if (!cat) {
    return service.apiCategory === categoryId || service.apiIconKey === categoryId;
  }
  return (
    service.apiCategory === cat.id ||
    service.apiIconKey === cat.id ||
    cat.backendCategories.includes(service.apiCategory) ||
    cat.iconKeys.includes(service.apiIconKey)
  );
}

export function mapApiServices(services: ApiService[]): CatalogService[] {
  return services.filter((s) => s.active !== false).map(apiServiceToService);
}

export function getCatalogCategories(services: CatalogService[]) {
  const withServices = TASKGO_CATEGORIES.filter((c) =>
    services.some((s) => serviceMatchesCategory(s, c.id)),
  );
  return withServices.length > 0 ? withServices.map(toCategoryChip) : HOME_CATEGORY_GRID.map(toCategoryChip);
}

function toCategoryChip(c: (typeof TASKGO_CATEGORIES)[number]) {
  return { id: c.id, name: c.label, icon: c.icon, color: c.color };
}

export function filterServicesByCategory(
  services: CatalogService[],
  categoryId?: string,
): CatalogService[] {
  if (!categoryId) return services;
  return services.filter((s) => serviceMatchesCategory(s, categoryId));
}

export function isMarketplaceTasker(user: UserDTO): boolean {
  return (
    user.role === "tasker" &&
    user.verificationStatus === "verified" &&
    user.accountStatus !== "blocked"
  );
}

/** Higher averageRating first, then totalReviews. */
export function compareMarketplaceTaskersByRating(a: UserDTO, b: UserDTO): number {
  const ratingA = a.averageRating ?? 0;
  const ratingB = b.averageRating ?? 0;
  if (ratingB !== ratingA) return ratingB - ratingA;
  return (b.totalReviews ?? 0) - (a.totalReviews ?? 0);
}

export function userDtoToCatalogTasker(
  user: UserDTO,
  index = 0,
  options?: { distanceKm?: number; customerLocation?: LatLng },
): Tasker {
  const hourly = 20 + (index % 5) * 3;
  let distanceKm =
    options?.distanceKm ??
    Math.round((1 + (index % 8) * 0.7) * 10) / 10;
  if (
    options?.distanceKm === undefined &&
    options?.customerLocation &&
    user.location?.lat != null &&
    user.location?.lng != null
  ) {
    distanceKm = roundKm(haversineKm(options.customerLocation, user.location));
  }
  return {
    id: user.id,
    userId: user.id,
    name: user.name,
    avatar: user.avatar ?? `https://i.pravatar.cc/200?img=${(index % 70) + 1}`,
    rating: user.averageRating ?? 4.8,
    jobs: user.totalReviews ?? 0,
    distanceKm,
    hourly,
    badges: user.verificationStatus === "verified" ? ["Verified"] : [],
    bio: "",
    verified: user.verificationStatus === "verified",
    online: Boolean(user.online),
    portfolio: [],
    availability: [],
  };
}

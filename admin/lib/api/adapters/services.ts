import type { Service } from "@/lib/mock-data";

/** Expected shape when GET /services is implemented (matches backend service schema). */
export type ApiService = {
  id: string;
  name: string;
  icon: string;
  category: string;
  description?: string;
  basePrice?: number;
  durationLabel?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const ICON_BY_KEY: Record<string, string> = {
  cleaning: "✨",
  gardening: "🌿",
  plumbing: "🔧",
  electric: "⚡",
  painting: "🎨",
  handyman: "🪛",
  ac: "❄️",
  moving: "📦",
  laundry: "🧺",
  repair: "🔧",
  home: "🏠",
  outdoor: "🌳",
};

const EMOJI_TO_KEY = Object.fromEntries(
  Object.entries(ICON_BY_KEY).map(([key, emoji]) => [emoji, key]),
);

/** Maps admin emoji or icon key to backend icon key. */
export function toApiIconKey(icon: string): string {
  const trimmed = icon.trim();
  const lower = trimmed.toLowerCase();
  if (ICON_BY_KEY[lower]) return lower;
  if (EMOJI_TO_KEY[trimmed]) return EMOJI_TO_KEY[trimmed];
  return "handyman";
}

/** Maps backend icon keys or emoji to admin card emoji. */
export function resolveServiceIcon(icon: string): string {
  const key = icon.trim().toLowerCase();
  if (ICON_BY_KEY[key]) return ICON_BY_KEY[key];
  if (icon.length <= 4) return icon;
  return "🧩";
}

export function mapApiServiceToService(api: ApiService, count = 0): Service {
  return {
    id: api.id,
    name: api.name,
    category: api.category,
    icon: resolveServiceIcon(api.icon),
    price: api.basePrice ?? 0,
    active: api.active ?? true,
    count,
    description: api.description?.trim() ?? "",
  };
}

/** Sets `count` to how many services share the same category (matches list card UX). */
export function applyCategoryCounts(services: Service[]): Service[] {
  const byCategory = new Map<string, number>();
  for (const s of services) {
    byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + 1);
  }
  return services.map((s) => ({
    ...s,
    count: byCategory.get(s.category) ?? 1,
  }));
}

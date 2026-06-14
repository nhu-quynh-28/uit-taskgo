import { TASKGO_CATEGORIES } from "@/lib/constants/categories";

export type Service = {
  id: string;
  name: string;
  icon: any;
  color: string;
  price: number;
  duration: string;
  description: string;
  includes: string[];
  rating: number;
  reviews: number;
};

export type Tasker = {
  id: string;
  /** Backend user id when browsing catalog taskers */
  userId?: string;
  name: string;
  avatar: string;
  rating: number;
  jobs: number;
  distanceKm: number;
  hourly: number;
  badges: string[];
  bio: string;
  verified: boolean;
  online: boolean;
  portfolio: string[];
  availability: string[];
};

/** @deprecated Import from `@/lib/constants/categories` — kept for legacy `{ name }` shape. */
export const categories = TASKGO_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.label,
  icon: c.icon,
  color: c.color,
}));

/** Catalog services come from GET /services via AppContext. */
export const services: Service[] = [];

/** Marketplace taskers come from GET /users/taskers via AppContext. */
export const taskers: Tasker[] = [];

export const promos = [
  { id: "p1", title: "30% off first booking", subtitle: "Welcome to TaskGo", color: "bg-emerald-100" },
  { id: "p2", title: "Refer & earn $10", subtitle: "Invite a friend today", color: "bg-blue-100" },
  { id: "p3", title: "Weekend special", subtitle: "Save up to 25%", color: "bg-amber-100" },
];

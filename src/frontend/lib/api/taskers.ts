import { apiRequest } from "./client";
import type { UserDTO } from "./types";
import {
  compareMarketplaceTaskersByRating,
  isMarketplaceTasker,
  userDtoToCatalogTasker,
} from "@/lib/adapters/catalogAdapter";
import type { Tasker } from "@/screens/data";
import { haversineKm, roundKm, type LatLng } from "@/lib/utils/distance";

export type { UserDTO as ApiTaskerUser };

export type ListTaskersParams = {
  scheduledStart?: string;
  scheduledEnd?: string;
};

export async function listTaskersRequest(params?: ListTaskersParams): Promise<UserDTO[]> {
  const query =
    params?.scheduledStart && params?.scheduledEnd
      ? `?scheduledStart=${encodeURIComponent(params.scheduledStart)}&scheduledEnd=${encodeURIComponent(params.scheduledEnd)}`
      : "";
  const { data } = await apiRequest<UserDTO[]>("get", `/users/taskers${query}`);
  return data;
}

let marketplaceInflight: Promise<UserDTO[]> | null = null;

/** Verified, active, non-blocked taskers from GET /users/taskers. */
export async function listMarketplaceTaskersRequest(
  params?: ListTaskersParams,
): Promise<UserDTO[]> {
  const rows = await listTaskersRequest(params);
  return rows.filter(isMarketplaceTasker);
}

export function sortTaskersByRating(users: UserDTO[]): UserDTO[] {
  return [...users].sort(compareMarketplaceTaskersByRating);
}

export function toRecommendedTaskers(users: UserDTO[], limit: number): Tasker[] {
  return sortTaskersByRating(users)
    .slice(0, limit)
    .map((u, i) => userDtoToCatalogTasker(u, i));
}

export function toNearbyTopTaskers(
  users: UserDTO[],
  customerLocation: LatLng | null | undefined,
  limit: number,
): Tasker[] {
  if (!customerLocation) {
    return toRecommendedTaskers(users, limit);
  }

  const ranked = users
    .map((user) => {
      const taskerLoc = user.location;
      const distanceKm =
        taskerLoc?.lat != null && taskerLoc?.lng != null
          ? roundKm(haversineKm(customerLocation, taskerLoc))
          : Number.POSITIVE_INFINITY;
      return { user, distanceKm };
    })
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      const ratingCmp = compareMarketplaceTaskersByRating(a.user, b.user);
      return ratingCmp;
    })
    .slice(0, limit);

  return ranked.map(({ user, distanceKm }, i) =>
    userDtoToCatalogTasker(user, i, { distanceKm }),
  );
}

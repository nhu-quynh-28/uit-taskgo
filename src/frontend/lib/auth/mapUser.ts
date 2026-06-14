import type { UserDTO } from "../api/types";

export const DEFAULT_AVATAR = "https://i.pravatar.cc/200?img=68";

export type AppProfileUser = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
};

export type AppRole = "customer" | "tasker";

/** Maps backend user to existing profile `User` shape (screens unchanged). */
export function userDtoToProfileUser(dto: UserDTO): AppProfileUser {
  return {
    name: dto.name,
    email: dto.email,
    phone: dto.phone ?? "",
    avatar: dto.avatar ?? DEFAULT_AVATAR,
  };
}

/** Customer/tasker routing; admin falls back to customer home. */
export function dtoRoleToAppRole(dto: UserDTO): AppRole {
  if (dto.role === "tasker") return "tasker";
  return "customer";
}


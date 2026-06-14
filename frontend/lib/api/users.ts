import { apiRequest } from "./client";
import type { SubmitKycInput, UserDTO } from "./types";

export type SavedAddressInput = {
  id: string;
  label: string;
  houseNumber?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  fullAddress?: string;
  line?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

export type UpdateProfileInput = {
  name?: string;
  phone?: string;
  dob?: string;
  address?: string;
  services?: string[];
  bio?: string;
  avatar?: string | null;
  online?: boolean;
  location?: { lat: number; lng: number };
  savedAddresses?: SavedAddressInput[];
};

export async function getUserByIdRequest(userId: string): Promise<UserDTO> {
  const { data } = await apiRequest<UserDTO>("get", `/users/${userId}`);
  return data;
}

export async function patchMeRequest(input: UpdateProfileInput): Promise<UserDTO> {
  const { data } = await apiRequest<UserDTO>("patch", "/users/me", { body: input });
  return data;
}

/** Tasker identity verification — POST /api/users/me/kyc */
export async function submitKycRequest(input: SubmitKycInput): Promise<UserDTO> {
  const { data } = await apiRequest<UserDTO>("post", "/users/me/kyc", { body: input });
  return data;
}

import { mapKycDto } from "../user/kyc.dto.js";

export function toUserDTO(user) {
  if (!user) return null;

  const {
    passwordHash: _passwordHash,
    __v: _v,
    ...rest
  } = user;

  return {
    id: rest.id,
    email: rest.email,
    role: rest.role,
    name: rest.name,
    phone: rest.phone,
    avatar: rest.avatar ?? null,
    online: rest.online,
    location: rest.location,
    savedAddresses: rest.savedAddresses ?? [],
    averageRating: rest.averageRating,
    totalReviews: rest.totalReviews,
    accountStatus: rest.accountStatus,
    verificationStatus: rest.verificationStatus,
    kyc: mapKycDto(rest.kyc),
    services: Array.isArray(rest.services) ? [...rest.services] : [],
    bio: rest.bio ?? "",
    createdAt: rest.createdAt,
    updatedAt: rest.updatedAt,
  };
}

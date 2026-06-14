import type { Address } from "@/screens/AppContext";
import type { UserDTO } from "@/lib/api/types";
import type { UpdateProfileInput } from "@/lib/api/users";
import type { LatLng } from "@/lib/utils/distance";

export type SavedAddressDTO = {
  id: string;
  label: string;
  houseNumber?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  /** Canonical full line (VN formatted). Legacy API field name: `line`. */
  fullAddress?: string;
  line?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  /** @deprecated US legacy — read only */
  state?: string;
  postalCode?: string;
};

export type VietnameseAddressParts = {
  houseNumber?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
};

const HOME_LOCATION_MAX = 42;

export function formatHouseStreet(parts: VietnameseAddressParts): string {
  const house = parts.houseNumber?.trim() ?? "";
  const street = parts.street?.trim() ?? "";
  if (house && street) return `${house} ${street}`;
  return house || street;
}

/** Full display: [house] [street], [ward], [district], [city] */
export function formatVietnameseFullAddress(parts: VietnameseAddressParts): string {
  const streetPart = formatHouseStreet(parts);
  const segments = [
    streetPart,
    parts.ward?.trim(),
    parts.district?.trim(),
    parts.city?.trim(),
  ].filter(Boolean);
  return segments.join(", ");
}

export function truncateAddressStart(text: string, maxLen = HOME_LOCATION_MAX): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}

/** Short label for Home header: house+street first, then district/ward/city */
export function formatHomeLocationShort(address: Address): string {
  const hnStreet = formatHouseStreet(address);
  const district = address.district?.trim();
  const ward = address.ward?.trim();
  const city = address.city?.trim();

  if (hnStreet && district) {
    return truncateAddressStart(`${hnStreet}, ${district}`);
  }
  if (hnStreet && ward) {
    return truncateAddressStart(`${hnStreet}, ${ward}`);
  }
  if (hnStreet && city) {
    return truncateAddressStart(`${hnStreet}, ${city}`);
  }

  const full = address.fullAddress?.trim() || address.line?.trim();
  if (full) return truncateAddressStart(full);

  return address.label?.trim() || "Add your address";
}

export function formatHomeLocation(addresses: Address[]): string {
  const d = addresses.find((a) => a.default) ?? addresses[0];
  if (!d) return "Add your address";
  return formatHomeLocationShort(d);
}

/** Customer position for nearby matching — default saved address GPS only. */
export function getDefaultAddressLatLng(addresses: Address[]): LatLng | null {
  const d = addresses.find((a) => a.default) ?? addresses[0];
  if (d?.latitude == null || d?.longitude == null) return null;
  if (!Number.isFinite(d.latitude) || !Number.isFinite(d.longitude)) return null;
  return { lat: d.latitude, lng: d.longitude };
}

function legacyUsToParts(dto: SavedAddressDTO): VietnameseAddressParts {
  const street = dto.street?.trim() ?? "";
  const city = dto.city?.trim() ?? "";
  const legacyState = dto.state?.trim() ?? "";
  return {
    houseNumber: "",
    street,
    ward: "",
    district: legacyState || "",
    city,
  };
}

function dtoToParts(dto: SavedAddressDTO): VietnameseAddressParts {
  if (dto.ward?.trim() || dto.district?.trim() || dto.houseNumber?.trim()) {
    return {
      houseNumber: dto.houseNumber ?? "",
      street: dto.street ?? "",
      ward: dto.ward ?? "",
      district: dto.district ?? "",
      city: dto.city ?? "",
    };
  }
  if (dto.state?.trim() && !dto.district?.trim()) {
    return legacyUsToParts(dto);
  }
  return parseFullAddressToParts(dto.fullAddress?.trim() || dto.line?.trim() || "");
}

export function parseFullAddressToParts(full: string): VietnameseAddressParts {
  const trimmed = full.trim();
  if (!trimmed) {
    return { houseNumber: "", street: "", ward: "", district: "", city: "" };
  }
  const segments = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  if (segments.length >= 4) {
    const city = segments[segments.length - 1];
    const district = segments[segments.length - 2];
    const ward = segments[segments.length - 3];
    const houseStreet = segments.slice(0, -3).join(", ");
    const match = houseStreet.match(/^(\d+\S*)\s+(.+)$/);
    if (match) {
      return {
        houseNumber: match[1],
        street: match[2],
        ward,
        district,
        city,
      };
    }
    return { houseNumber: "", street: houseStreet, ward, district, city };
  }
  if (segments.length === 3) {
    const [first, district, city] = segments;
    const match = first.match(/^(\d+\S*)\s+(.+)$/);
    if (match) {
      return {
        houseNumber: match[1],
        street: match[2],
        ward: "",
        district,
        city,
      };
    }
    return { houseNumber: "", street: first, ward: "", district, city };
  }
  if (segments.length === 2) {
    return { houseNumber: "", street: segments[0], ward: "", district: "", city: segments[1] };
  }
  const match = trimmed.match(/^(\d+\S*)\s+(.+)$/);
  if (match) {
    return { houseNumber: match[1], street: match[2], ward: "", district: "", city: "" };
  }
  return { houseNumber: "", street: trimmed, ward: "", district: "", city: "" };
}

export function dtoAddressesToApp(dtos: SavedAddressDTO[] | undefined): Address[] {
  if (!dtos?.length) return [];
  return dtos.map((dto) => {
    const parts = dtoToParts(dto);
    const fullAddress =
      dto.fullAddress?.trim() ||
      dto.line?.trim() ||
      formatVietnameseFullAddress(parts);
    return {
      id: dto.id,
      label: dto.label,
      houseNumber: parts.houseNumber ?? "",
      street: parts.street ?? "",
      ward: parts.ward ?? "",
      district: parts.district ?? "",
      city: parts.city ?? "",
      fullAddress,
      line: fullAddress,
      latitude: dto.latitude,
      longitude: dto.longitude,
      default: Boolean(dto.isDefault),
    };
  });
}

export function appAddressesToDto(addresses: Address[]): SavedAddressDTO[] {
  return addresses.map((a) => {
    const parts: VietnameseAddressParts = {
      houseNumber: a.houseNumber?.trim() ?? "",
      street: a.street?.trim() ?? "",
      ward: a.ward?.trim() ?? "",
      district: a.district?.trim() ?? "",
      city: a.city?.trim() ?? "",
    };
    const fullAddress = a.fullAddress?.trim() || formatVietnameseFullAddress(parts);
    return {
      id: a.id,
      label: a.label.trim() || "Address",
      houseNumber: parts.houseNumber,
      street: parts.street,
      ward: parts.ward,
      district: parts.district,
      city: parts.city,
      fullAddress,
      line: fullAddress,
      latitude: a.latitude,
      longitude: a.longitude,
      isDefault: a.default,
    };
  });
}

export function syncAddressesFromUser(dto: UserDTO): Address[] {
  return dtoAddressesToApp(dto.savedAddresses);
}

export function buildUpdateWithAddresses(
  addresses: Address[],
): Pick<UpdateProfileInput, "savedAddresses"> {
  return { savedAddresses: appAddressesToDto(addresses) };
}

/** Persist addresses and sync user.location from the default address coordinates. */
export function buildProfileAddressUpdate(addresses: Address[]): UpdateProfileInput {
  const savedAddresses = appAddressesToDto(addresses);
  const def = addresses.find((a) => a.default) ?? addresses[0];
  const update: UpdateProfileInput = { savedAddresses };
  if (def?.latitude != null && def?.longitude != null) {
    update.location = { lat: def.latitude, lng: def.longitude };
  }
  return update;
}

export function addressToFormFields(a: Address): Required<VietnameseAddressParts> & { label: string } {
  const parts =
    a.ward?.trim() || a.district?.trim() || a.houseNumber?.trim()
      ? {
          houseNumber: a.houseNumber ?? "",
          street: a.street ?? "",
          ward: a.ward ?? "",
          district: a.district ?? "",
          city: a.city ?? "",
        }
      : parseFullAddressToParts(a.fullAddress || a.line || "");
  return {
    label: a.label,
    houseNumber: parts.houseNumber ?? "",
    street: parts.street ?? "",
    ward: parts.ward ?? "",
    district: parts.district ?? "",
    city: parts.city ?? "",
  };
}

export function formFieldsToAddress(
  editing: Address,
  form: Required<VietnameseAddressParts> & { label: string },
  coords?: { latitude?: number; longitude?: number },
): Address {
  const parts: VietnameseAddressParts = {
    houseNumber: form.houseNumber.trim(),
    street: form.street.trim(),
    ward: form.ward.trim(),
    district: form.district.trim(),
    city: form.city.trim(),
  };
  const fullAddress = formatVietnameseFullAddress(parts);
  const latitude = coords?.latitude ?? editing.latitude;
  const longitude = coords?.longitude ?? editing.longitude;
  return {
    ...editing,
    label: form.label.trim(),
    ...parts,
    fullAddress,
    line: fullAddress,
    latitude,
    longitude,
  };
}

export function ensureOneDefault(addresses: Address[], preferredId?: string): Address[] {
  if (addresses.length === 0) return addresses;
  const id = preferredId ?? addresses.find((a) => a.default)?.id ?? addresses[0].id;
  return addresses.map((a) => ({ ...a, default: a.id === id }));
}

/** @deprecated Use addressToFormFields */
export function parseLineToFields(line: string): Pick<Address, "street" | "city"> {
  const p = parseFullAddressToParts(line);
  return { street: formatHouseStreet(p) || p.street || "", city: p.city ?? "" };
}

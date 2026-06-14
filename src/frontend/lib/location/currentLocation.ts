import * as Location from "expo-location";
import type { VietnameseAddressParts } from "@/lib/profile/addresses";

export type CurrentLocationResult = VietnameseAddressParts & {
  latitude: number;
  longitude: number;
};

function pickWard(place: Location.LocationGeocodedAddress): string {
  const candidates = [place.name, place.subregion, place.district].filter(Boolean) as string[];
  for (const c of candidates) {
    if (/phường|ward|p\.\s*\d/i.test(c)) return c.trim();
  }
  return "";
}

function pickDistrict(place: Location.LocationGeocodedAddress): string {
  const district = place.district?.trim();
  if (district && !/phường|ward/i.test(district)) return district;
  const sub = place.subregion?.trim();
  if (sub && /quận|district|huyện/i.test(sub)) return sub;
  if (district) return district;
  return sub ?? "";
}

function mapGeocodedAddress(
  place: Location.LocationGeocodedAddress,
  latitude: number,
  longitude: number,
): CurrentLocationResult {
  const houseNumber = place.streetNumber?.trim() ?? "";
  const street = (place.street ?? place.name ?? "").trim();
  const ward = pickWard(place);
  const district = pickDistrict(place);
  const city = (place.city ?? place.region ?? "").trim() || "Ho Chi Minh City";

  return {
    houseNumber,
    street,
    ward,
    district,
    city,
    latitude,
    longitude,
  };
}

/** Request permission, read GPS, reverse-geocode to Vietnamese address fields. */
export async function getCurrentLocationWithAddress(): Promise<CurrentLocationResult> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Location services are turned off on this device.");
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Location permission is required to use your current location.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];
  if (!place) {
    throw new Error("Could not resolve an address for your current location.");
  }

  return mapGeocodedAddress(place, latitude, longitude);
}

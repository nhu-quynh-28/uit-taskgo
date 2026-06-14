import * as Location from "expo-location";

export type GpsCoordinates = { lat: number; lng: number };

/**
 * Read device GPS for tasker presence updates (no reverse geocode).
 * Returns null when services are off or permission denied.
 */
export async function getTaskerGpsCoordinates(): Promise<GpsCoordinates | null> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) return null;

  const { status } = await Location.getForegroundPermissionsAsync();
  const granted =
    status === "granted"
      ? true
      : (await Location.requestForegroundPermissionsAsync()).status === "granted";
  if (!granted) return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { lat: latitude, lng: longitude };
}

/**
 * Runtime configuration from Expo public env vars.
 * Defaults target local backend (see backend/README.md).
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";
const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const config = {
  apiUrl: trimTrailingSlash(apiUrl),
  socketUrl: trimTrailingSlash(socketUrl),
} as const;

if (__DEV__ && /localhost|127\.0\.0\.1/i.test(config.apiUrl)) {
  console.warn(
    "[TaskGo] EXPO_PUBLIC_API_URL points to localhost — physical devices cannot reach it. " +
      "Set your Mac LAN IP in frontend/.env, e.g. EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api",
  );
}

if (__DEV__ && /localhost|127\.0\.0\.1/i.test(config.socketUrl)) {
  console.warn(
    "[TaskGo] EXPO_PUBLIC_SOCKET_URL points to localhost — use your Mac LAN IP for real devices, " +
      "e.g. EXPO_PUBLIC_SOCKET_URL=http://172.20.10.3:4000",
  );
}

export type AppConfig = typeof config;

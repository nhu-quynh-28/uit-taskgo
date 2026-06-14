import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "taskgo_access_token";

/**
 * Persists JWT for API and Socket.IO (Phase 2+).
 * Screens must not import this until auth integration.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    // Key may not exist
  }
}

export async function hasAccessToken(): Promise<boolean> {
  const token = await getAccessToken();
  return Boolean(token && token.length > 0);
}

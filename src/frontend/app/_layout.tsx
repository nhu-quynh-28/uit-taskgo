/**
 * Legacy expo-router layout — not used when `package.json` main is `index.js`.
 * Custom routing lives in AppRoot.tsx → screens/App.tsx (AppContext).
 * Global styles load from index.js → ./global.css (single import).
 */
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

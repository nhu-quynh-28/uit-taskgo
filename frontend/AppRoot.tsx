import { AppProvider } from "@/screens/AppContext";
import Router from "@/screens/App";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * App shell — custom AppContext routing only (no React Navigation / expo-router screens).
 */
export default function AppRoot() {
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Router />
        </AppProvider>
      </SafeAreaProvider>
    </View>
  );
}

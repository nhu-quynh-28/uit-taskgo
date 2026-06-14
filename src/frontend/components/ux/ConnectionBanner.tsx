import React from "react";
import { ActivityIndicator, Text, View, TouchableOpacity } from "react-native";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { useApp } from "@/screens/AppContext";

export function ConnectionBanner() {
  const { socketStatus, isAuthenticated, retrySocketConnection } = useApp();

  if (!isAuthenticated || socketStatus === "connected" || socketStatus === "idle") {
    return null;
  }

  const reconnecting = socketStatus === "connecting" || socketStatus === "reconnecting";

  return (
    <View
      className={`px-4 py-2.5 flex-row items-center justify-center gap-2 z-50 ${
        reconnecting ? "bg-amber-50 border-b border-amber-100" : "bg-red-50 border-b border-red-100"
      }`}
    >
      {reconnecting ? (
        <ActivityIndicator size="small" color="#b45309" />
      ) : (
        <WifiOff size={16} color="#b91c1c" />
      )}
      <Text
        className={`text-xs font-bold flex-1 text-center ${
          reconnecting ? "text-amber-900" : "text-red-800"
        }`}
      >
        {reconnecting
          ? "Reconnecting to live updates…"
          : "You're offline — order & chat updates may be delayed"}
      </Text>
      {!reconnecting ? (
        <TouchableOpacity
          onPress={() => retrySocketConnection()}
          className="flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white/80"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RefreshCw size={14} color="#b91c1c" />
          <Text className="text-[11px] font-bold text-red-700">Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

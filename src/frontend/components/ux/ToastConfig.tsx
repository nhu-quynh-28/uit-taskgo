import React from "react";
import { Text, View } from "react-native";
import { CheckCircle2, AlertCircle, Info } from "lucide-react-native";
import type { BaseToastProps } from "react-native-toast-message";

function ToastCard({
  text1,
  tone,
  icon: Icon,
}: BaseToastProps & { tone: string; icon: typeof CheckCircle2 }) {
  return (
    <View
      pointerEvents="auto"
      className={`mx-4 px-4 py-3 rounded-2xl border shadow-lg flex-row items-center gap-3 ${tone}`}
      style={{
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      }}
    >
      <Icon size={20} color="#1A2421" />
      <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={3}>
        {text1}
      </Text>
    </View>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastCard {...props} tone="bg-emerald-50 border-emerald-200" icon={CheckCircle2} />
  ),
  error: (props: BaseToastProps) => (
    <ToastCard {...props} tone="bg-red-50 border-red-200" icon={AlertCircle} />
  ),
  info: (props: BaseToastProps) => (
    <ToastCard {...props} tone="bg-white border-border" icon={Info} />
  ),
};

import React from "react";
import { Text, View } from "react-native";

type Tone = { container: string; text: string; dot?: string };

function resolveTone(label: string): Tone {
  const key = label.toLowerCase();

  if (key.includes("cancel")) {
    return { container: "bg-red-50 border-red-100", text: "text-red-700", dot: "bg-red-500" };
  }
  if (key.includes("complete")) {
    return { container: "bg-emerald-50 border-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" };
  }
  if (key.includes("payment") || key.includes("unpaid") || key.includes("failed")) {
    return { container: "bg-orange-50 border-orange-100", text: "text-orange-800", dot: "bg-orange-500" };
  }
  if (key.includes("finding") || key.includes("pending")) {
    return { container: "bg-violet-50 border-violet-100", text: "text-violet-800", dot: "bg-violet-500" };
  }
  if (key.includes("arrived") || key.includes("progress") || key.includes("ongoing")) {
    return { container: "bg-amber-50 border-amber-100", text: "text-amber-900", dot: "bg-amber-500" };
  }
  if (key.includes("accept") || key.includes("upcoming")) {
    return { container: "bg-blue-50 border-blue-100", text: "text-blue-800", dot: "bg-blue-500" };
  }

  return { container: "bg-muted border-border", text: "text-muted-foreground", dot: "bg-gray-400" };
}

export type StatusChipProps = {
  label: string;
  showDot?: boolean;
  size?: "sm" | "md";
};

export function StatusChip({ label, showDot = true, size = "sm" }: StatusChipProps) {
  const tone = resolveTone(label);
  const isMd = size === "md";

  return (
    <View
      className={`flex-row items-center gap-1.5 border rounded-full ${
        isMd ? "px-3 py-1.5" : "px-2.5 py-1"
      } ${tone.container}`}
    >
      {showDot ? <View className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} /> : null}
      <Text
        className={`font-black uppercase tracking-wide ${tone.text} ${
          isMd ? "text-[11px]" : "text-[10px]"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

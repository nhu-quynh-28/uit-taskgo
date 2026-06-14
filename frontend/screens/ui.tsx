import { StatusChip } from "@/components/ux/StatusChip";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "lucide-react-native";
import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./AppContext";

export { StatusChip };

// --- Screen ---
export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className={`flex-1 bg-background ${className}`}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  );
}

// --- TopBar ---
export type TopBarProps = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
};

export function TopBar({
  title, onBack, right, transparent,
}: TopBarProps) {
  const { back } = useApp();
  
  return (
    <View
      className={`flex-row items-center gap-3 px-4 h-14 z-30 ${
        transparent ? "bg-transparent" : "bg-card border-b border-border"
      }`}
    >
      <TouchableOpacity
        onPress={onBack || back}
        className="w-10 h-10 -ml-2 items-center justify-center rounded-full active:bg-muted"
      >
        <ChevronLeft size={24} color="#000" />
      </TouchableOpacity>
      
      {title && (
        <Text className="text-base font-bold flex-1 text-foreground" numberOfLines={1}>
          {title}
        </Text>
      )}
      
      <View className="ml-auto flex-row items-center gap-2">
        {right}
      </View>
    </View>
  );
}

// --- PrimaryButton ---
export type PrimaryButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
};

export function PrimaryButton({
  children, onClick, disabled, loading, variant = "primary", className = "",
}: PrimaryButtonProps) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";

  const handlePress = () => {
    if (disabled || loading) return;
    if (variant === "primary") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onClick?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      className={`h-14 w-full rounded-2xl flex-row items-center justify-center gap-2 px-4 ${
        isPrimary ? "bg-primary shadow-sm" : isOutline ? "border-2 border-primary" : ""
      } ${disabled || loading ? "opacity-55" : ""} ${className}`}
      style={
        isPrimary
          ? { backgroundColor: "#2E7D5B" }
          : isOutline
            ? { borderColor: "#2E7D5B", borderWidth: 2 }
            : undefined
      }
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "white" : "#2E7D5B"} />
      ) : (
        typeof children === "string" ? (
          <Text
            className={`font-bold text-[15px] ${
              isPrimary ? "text-primary-foreground" : "text-primary"
            }`}
            style={{ color: isPrimary ? "#F7FBF9" : "#2E7D5B" }}
          >
            {children}
          </Text>
        ) : (
          children
        )
      )}
    </TouchableOpacity>
  );
}

// --- Card ---
export type CardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ children, className = "", onClick }: CardProps) {
  const classNames = `bg-card rounded-[24px] border border-border shadow-sm overflow-hidden ${className}`;

  if (!onClick) {
    return <View className={classNames}>{children}</View>;
  }

  return (
    <TouchableOpacity onPress={onClick} activeOpacity={0.92} className={classNames}>
      {children}
    </TouchableOpacity>
  );
}

// --- Chip ---
export type ChipProps = {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
};

export function Chip({
  active, children, onClick,
}: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.8}
      className={`px-5 h-10 rounded-full flex-row items-center justify-center ${
        active ? "bg-primary" : "bg-muted"
      }`}
    >
      <Text className={`text-sm font-bold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// --- Field ---
export type FieldProps = {
  label: string;
  children: ReactNode;
  error?: string;
};

export function Field({
  label, children, error,
}: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
        {label}
      </Text>
      {children}
      {error && (
        <Text className="text-xs text-red-500 mt-1.5 font-medium">
          {error}
        </Text>
      )}
    </View>
  );
}

// --- Input ---
export type InputProps = TextInputProps & {
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Input(props: InputProps) {
  const { className = "", style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      {...rest}
      className={`w-full h-14 px-4 rounded-2xl bg-muted/50 border border-transparent focus:border-primary text-[15px] font-medium text-foreground ${className}`}
      style={[{ textAlignVertical: 'center' }, style]}
    />
  );
}
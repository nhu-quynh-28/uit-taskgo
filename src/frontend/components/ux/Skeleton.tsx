import React, { useEffect, useRef } from "react";
import { Animated, View, type ViewProps } from "react-native";

function usePulseOpacity() {
  const anim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim;
}

export function SkeletonBox({
  className = "",
  style,
}: {
  className?: string;
  style?: ViewProps["style"];
}) {
  const opacity = usePulseOpacity();
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ opacity }, style]}
      className={`bg-muted rounded-2xl ${className}`}
    />
  );
}

export function OrderCardSkeleton() {
  return (
    <View className="mb-4 p-4 rounded-[24px] border border-border bg-card">
      <View className="flex-row items-center gap-3">
        <SkeletonBox className="w-12 h-12 rounded-2xl" />
        <View className="flex-1 gap-2">
          <SkeletonBox className="h-4 w-3/5" />
          <SkeletonBox className="h-3 w-2/5" />
        </View>
        <SkeletonBox className="h-6 w-16 rounded-full" />
      </View>
      <SkeletonBox className="h-[1px] w-full my-4" />
      <View className="flex-row items-center gap-3">
        <SkeletonBox className="w-8 h-8 rounded-full" />
        <SkeletonBox className="h-3 flex-1" />
        <SkeletonBox className="h-5 w-12" />
      </View>
    </View>
  );
}

export function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="px-5 pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function ChatRowSkeleton() {
  return (
    <View className="flex-row items-center gap-4 py-4">
      <SkeletonBox className="w-14 h-14 rounded-2xl" />
      <View className="flex-1 gap-2">
        <SkeletonBox className="h-4 w-2/5" />
        <SkeletonBox className="h-3 w-4/5" />
      </View>
    </View>
  );
}

export function ChatListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View className="px-5">
      {Array.from({ length: count }).map((_, i) => (
        <ChatRowSkeleton key={i} />
      ))}
    </View>
  );
}

export function ReviewCardSkeleton() {
  return (
    <View className="p-4 mb-4 rounded-[24px] border border-border bg-card">
      <View className="flex-row gap-3 mb-3">
        <SkeletonBox className="w-10 h-10 rounded-full" />
        <View className="flex-1 gap-2">
          <SkeletonBox className="h-3 w-1/3" />
          <SkeletonBox className="h-3 w-1/2" />
        </View>
      </View>
      <SkeletonBox className="h-3 w-full mb-2" />
      <SkeletonBox className="h-3 w-4/5" />
    </View>
  );
}

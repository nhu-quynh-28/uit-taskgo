import * as React from "react";
import { View, Animated } from "react-native";
import { cn } from '@/components/lib/utils';

function Skeleton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  // Tạo giá trị Animated để điều khiển độ mờ (opacity)
  const pulseAnim = React.useRef(new Animated.Value(0.12)).current;

  React.useEffect(() => {
    // Thiết lập vòng lặp animation nhấp nháy
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.12,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={{ opacity: pulseAnim }}
      className={cn("rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
import * as React from "react";
import { View, StyleSheet } from "react-native";

import { cn } from '@/components/lib/utils';

// Định nghĩa Interface cho Component
interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof View> {
  ratio?: number;
}

const AspectRatio = React.forwardRef<View, AspectRatioProps>(
  ({ className, ratio = 1 / 1, style, ...props }, ref) => (
    <View
      ref={ref}
      style={[
        { aspectRatio: ratio, width: "100%" }, // Logic quan trọng nhất nằm ở đây
        style,
      ]}
      className={cn("overflow-hidden", className)}
      {...props}
    />
  )
);

AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
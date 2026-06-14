import * as React from "react";
import { ScrollView, View } from "react-native";

import { cn } from '@/components/lib/utils';

const ScrollArea = React.forwardRef<
  ScrollView,
  React.ComponentPropsWithoutRef<typeof ScrollView>
>(({ className, children, ...props }, ref) => (
  <View className={cn("relative flex-1 overflow-hidden", className)}>
    <ScrollView
      ref={ref}
      className="h-full w-full"
      // Ẩn thanh cuộn mặc định nếu muốn giống giao diện Web sạch sẽ
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  </View>
));
ScrollArea.displayName = "ScrollArea";

// Trong React Native, thanh cuộn thường do hệ điều hành quản lý.
// Mình giữ lại khung ScrollBar này để bạn không phải xóa code ở các nơi khác,
// nhưng trên Mobile nó sẽ không render gì cả để đảm bảo hiệu năng.
const ScrollBar = () => null;

export { ScrollArea, ScrollBar };
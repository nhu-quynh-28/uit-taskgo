import * as React from "react";
import { View } from "react-native";
import { GripVertical } from "lucide-react-native";

import { cn } from '@/components/lib/utils';

// Trên Mobile, chúng ta thường sử dụng Flexbox để quản lý tỷ lệ bảng thay vì thư viện kéo thả
const ResizablePanelGroup = ({ 
  className, 
  direction = "horizontal", 
  ...props 
}: React.ComponentPropsWithoutRef<typeof View> & { direction?: "horizontal" | "vertical" }) => (
  <View
    className={cn(
      "flex h-full w-full",
      direction === "vertical" ? "flex-col" : "flex-row",
      className
    )}
    {...props}
  />
);

const ResizablePanel = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => (
  <View 
    className={cn("flex-1", className)} 
    {...props} 
  />
);

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & {
  withHandle?: boolean;
}) => (
  <View
    className={cn(
      "flex items-center justify-center bg-border",
      // Định dạng thanh ngăn cách dựa trên hướng của group (giả định mặc định là ngang)
      "w-[1px] h-full", 
      className,
    )}
    {...props}
  >
    {withHandle && (
      <View className="z-10 flex h-6 w-4 items-center justify-center rounded-sm border border-border bg-background shadow-sm">
        <GripVertical size={12} className="text-muted-foreground" />
      </View>
    )}
  </View>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
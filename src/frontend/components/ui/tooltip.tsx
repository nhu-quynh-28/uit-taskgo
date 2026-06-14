import * as React from "react";
import { View, Text } from "react-native";
import * as TooltipPrimitive from "@rn-primitives/tooltip";

import { cn } from '@/components/lib/utils'; // Đảm bảo alias @/ đã hoạt động

// Loại bỏ TooltipPrimitive.Provider vì nó không tồn tại trong bản Native
const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 shadow-md",
        className
      )}
      {...props}
    >
      <Text className="text-xs text-primary-foreground font-medium">
        {props.children as any}
      </Text>
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
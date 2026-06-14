import * as React from "react";
import { View } from "react-native";
import * as SliderPrimitive from "@rn-primitives/slider";

import { cn } from '@/components/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex flex-row w-full items-center justify-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "block h-6 w-6 rounded-full border border-primary/50 bg-background shadow-md",
        "active:scale-110 transition-transform" // Hiệu ứng khi đang kéo
      )} 
    />
  </SliderPrimitive.Root>
));

Slider.displayName = "Slider";

export { Slider };
import * as React from "react";
import { TextInput, View } from "react-native";

import { cn } from '@/components/lib/utils';

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  React.ComponentPropsWithoutRef<typeof TextInput>
>(({ className, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm native:h-12 native:text-lg web:focus-visible:outline-none web:focus-visible:ring-1 web:focus-visible:ring-ring disabled:opacity-50",
        className
      )}
      placeholderTextColor="#a1a1aa" // Màu của muted-foreground
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
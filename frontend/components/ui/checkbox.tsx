import * as React from "react";
import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import { Check } from "lucide-react-native";

import { cn } from '@/components/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-6 w-6 shrink-0 rounded-sm border border-primary flex items-center justify-center active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
      props.checked && "bg-primary", // Tailwind class cho trạng thái checked trên mobile
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("items-center justify-center")}>
      <Check size={16} strokeWidth={3} className="text-primary-foreground" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
import * as React from "react";
import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from '@/components/lib/utils';

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 flex-row items-start", // Sử dụng flex-row để icon và text nằm cùng hàng
  {
    variants: {
      variant: {
        default: "bg-background border-border",
        destructive: "border-destructive/50 bg-destructive/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  Text,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  Text,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
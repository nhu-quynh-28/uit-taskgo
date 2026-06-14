import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Slot } from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from '@/components/lib/utils';

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary active:opacity-90",
        destructive: "bg-destructive active:opacity-90",
        outline: "border border-input bg-background active:bg-accent",
        secondary: "bg-secondary active:opacity-80",
        ghost: "active:bg-accent",
        link: "bg-transparent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva(
  "text-sm font-medium",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-destructive-foreground",
        outline: "text-foreground",
        secondary: "text-secondary-foreground",
        ghost: "text-foreground",
        link: "text-primary underline",
      },
      size: {
        default: "",
        sm: "text-xs",
        lg: "text-base",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  textClassName?: string;
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, asChild = false, children, textClassName, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <Pressable
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, className }),
          props.disabled && "opacity-50"
        )}
        {...props}
      >
        {/* Kiểm tra nếu children là chuỗi thì bọc trong Text, nếu không thì render trực tiếp */}
        {typeof children === "string" ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
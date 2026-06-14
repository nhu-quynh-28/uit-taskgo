import * as React from "react";
import { View, Text, Pressable } from "react-native";
import { Slot } from "@rn-primitives/slot";
import { ChevronRight, MoreHorizontal } from "lucide-react-native";

import { cn } from '@/components/lib/utils';

const Breadcrumb = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View>
>(({ ...props }, ref) => <View ref={ref} {...props} />);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "flex flex-row flex-wrap items-center gap-1.5",
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View 
    ref={ref} 
    className={cn("flex-row items-center gap-1.5", className)} 
    {...props} 
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof Pressable> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : Pressable;

  return (
    <Comp
      ref={ref}
      className={cn("active:opacity-70", className)}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  Text,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => (
  <View
    className={cn("", className)}
    {...props}
  >
    {children ?? <ChevronRight size={14} className="text-muted-foreground" />}
  </View>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => (
  <View
    className={cn("flex-row h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal size={16} className="text-foreground" />
  </View>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
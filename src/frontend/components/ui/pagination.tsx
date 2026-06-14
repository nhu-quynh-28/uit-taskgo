import * as React from "react";
import { View, Text } from "react-native";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react-native";

import { cn } from '@/components/lib/utils';
import { Button, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => (
  <View
    role="navigation"
    className={cn("mx-auto flex-row w-full justify-center gap-1", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<View, React.ComponentPropsWithoutRef<typeof View>>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex-row items-center gap-1", className)} {...props} />
  ),
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<View, React.ComponentPropsWithoutRef<typeof View>>(
  ({ className, ...props }, ref) => <View ref={ref} className={cn("", className)} {...props} />,
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  onPress?: () => void;
} & React.ComponentPropsWithoutRef<typeof Button>;

const PaginationLink = ({ className, isActive, size = "icon", onPress, ...props }: PaginationLinkProps) => (
  <Button
    variant={isActive ? "outline" : "ghost"}
    size={size}
    onPress={onPress}
    className={cn(className)}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft size={16} className="text-foreground" />
    <Text className="text-foreground">Trước</Text>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <Text className="text-foreground">Sau</Text>
    <ChevronRight size={16} className="text-foreground" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => (
  <View
    className={cn("flex h-10 w-10 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal size={16} className="text-muted-foreground" />
  </View>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
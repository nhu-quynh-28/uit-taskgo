import React from "react";
import {
  ScrollView,
  Text,
  View,
  ViewProps,
  TextProps,
} from "react-native";

import { cn } from '@/components/lib/utils';

export function Table({
  className,
  children,
  ...props
}: ViewProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </View>
    </ScrollView>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: ViewProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn("border-b border-border", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: ViewProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={cn("", className)} {...props}>
      {children}
    </View>
  );
}

export function TableFooter({
  className,
  children,
  ...props
}: ViewProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        "border-t border-border bg-muted/50",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: ViewProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center border-b border-border px-2 py-3",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: TextProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      className={cn(
        "flex-1 text-sm font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: TextProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      className={cn(
        "flex-1 text-sm text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export function TableCaption({
  className,
  children,
  ...props
}: TextProps & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      className={cn(
        "mt-2 text-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}
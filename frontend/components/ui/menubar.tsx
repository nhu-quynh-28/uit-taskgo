import * as React from "react";
import { View, Text } from "react-native";
import * as MenubarPrimitive from "@rn-primitives/menubar";
import { Check, ChevronRight, Circle } from "lucide-react-native";

import { cn } from '@/components/lib/utils';

const MenubarMenu = MenubarPrimitive.Menu;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarPortal = MenubarPrimitive.Portal;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;
const MenubarSub = MenubarPrimitive.Sub;

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex flex-row h-10 items-center space-x-1 rounded-md border border-border bg-background p-1",
      className
    )}
    {...props}
  />
));
Menubar.displayName = "Menubar";

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex flex-row items-center rounded-sm px-3 py-1 active:bg-accent",
      className
    )}
    {...props}
  >
    <Text className="text-sm font-medium text-foreground">{props.children as any}</Text>
  </MenubarPrimitive.Trigger>
));
MenubarTrigger.displayName = "MenubarTrigger";

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex flex-row items-center rounded-sm px-2 py-1.5 active:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    <Text className="text-sm text-foreground flex-1">{children as any}</Text>
    <ChevronRight size={14} className="ml-auto text-muted-foreground" />
  </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = "MenubarSubTrigger";

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md",
        className
      )}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarContent.displayName = "MenubarContent";

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex flex-row items-center rounded-sm px-2 py-1.5 active:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    <Text className="text-sm text-foreground">{props.children as any}</Text>
  </MenubarPrimitive.Item>
));
MenubarItem.displayName = "MenubarItem";

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex flex-row items-center rounded-sm py-1.5 pl-8 pr-2 active:bg-accent",
      className
    )}
    checked={checked}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check size={14} className="text-foreground" />
      </MenubarPrimitive.ItemIndicator>
    </View>
    <Text className="text-sm text-foreground">{children as any}</Text>
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
MenubarSeparator.displayName = "MenubarSeparator";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarPortal,
  MenubarGroup,
  MenubarSub,
  MenubarSubTrigger,
};
import * as React from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Search } from "lucide-react-native";
import { cn } from '@/components/lib/utils';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Command = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover",
      className
    )}
    {...props}
  />
));
Command.displayName = "Command";

const CommandDialog = ({ children, ...props }: any) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  TextInput,
  React.ComponentPropsWithoutRef<typeof TextInput>
>(({ className, ...props }, ref) => (
  <View className="flex-row items-center border-b border-border px-3">
    <Search size={16} className="mr-2 text-muted-foreground opacity-50" />
    <TextInput
      ref={ref}
      className={cn(
        "flex h-12 w-full bg-transparent py-3 text-sm text-foreground outline-none",
        className
      )}
      placeholderTextColor="#a1a1aa"
      {...props}
    />
  </View>
));
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<
  ScrollView,
  React.ComponentPropsWithoutRef<typeof ScrollView>
>(({ className, ...props }, ref) => (
  <ScrollView
    ref={ref}
    className={cn("max-h-[300px]", className)}
    {...props}
  />
));
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View>
>(({ children, className, ...props }, ref) => (
  <View ref={ref} className={cn("py-6 items-center justify-center", className)} {...props}>
    <Text className="text-sm text-muted-foreground">
      {children || "Không tìm thấy kết quả."}
    </Text>
  </View>
));
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View> & { heading?: string }
>(({ className, heading, children, ...props }, ref) => (
  <View ref={ref} className={cn("overflow-hidden p-1", className)} {...props}>
    {heading && (
      <Text className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {heading}
      </Text>
    )}
    {children}
  </View>
));
CommandGroup.displayName = "CommandGroup";

const CommandSeparator = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = "CommandSeparator";

const CommandItem = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof Pressable>
>(({ className, children, ...props }, ref) => (
  <Pressable
    ref={ref as any}
    className={({ pressed }) => cn(
      "relative flex-row gap-2 items-center rounded-sm px-2 py-3 active:bg-accent",
      pressed && "bg-accent",
      className
    )}
    {...props}
  >
    {children}
  </Pressable>
));
CommandItem.displayName = "CommandItem";

const CommandShortcut = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) => {
  return (
    <Text
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
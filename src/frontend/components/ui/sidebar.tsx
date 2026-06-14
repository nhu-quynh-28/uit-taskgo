import * as React from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { Slot } from "@rn-primitives/slot";
import { PanelLeft, ChevronRight } from "lucide-react-native";
import { cn } from '@/components/lib/utils';

// Sử dụng Sheet (Drawer) mà chúng ta đã chuyển đổi trước đó
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SIDEBAR_WIDTH = Dimensions.get("window").width * 0.75;

type SidebarContextProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}

// 1. SidebarProvider
export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const toggleSidebar = () => setOpen((prev) => !prev);

  const value = React.useMemo(() => ({ open, setOpen, toggleSidebar }), [open]);

  return (
    <SidebarContext.Provider value={value}>
      <View className="flex-1 bg-background">{children}</View>
    </SidebarContext.Provider>
  );
};

// 2. Sidebar (Dạng Drawer cho Mobile)
export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { open, setOpen } = useSidebar();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 w-[280px] bg-sidebar">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle className="text-sidebar-foreground">Menu</SheetTitle>
        </SheetHeader>
        <ScrollView className="flex-1">{children}</ScrollView>
      </SheetContent>
    </Sheet>
  );
};

// 3. Sidebar components nhỏ
export const SidebarGroup = ({ children, className }: any) => (
  <View className={cn("p-2 gap-1", className)}>{children}</View>
);

export const SidebarGroupLabel = ({ children }: any) => (
  <Text className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase">
    {children}
  </Text>
);

export const SidebarMenu = ({ children }: any) => (
  <View className="gap-1">{children}</View>
);

export const SidebarMenuButton = ({ 
  children, 
  onPress, 
  isActive 
}: { 
  children: React.ReactNode; 
  onPress?: () => void;
  isActive?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    className={cn(
      "flex-row items-center gap-3 px-3 py-2.5 rounded-lg active:bg-sidebar-accent",
      isActive && "bg-sidebar-accent"
    )}
  >
    <Slot className={cn("text-sidebar-foreground", isActive && "text-sidebar-accent-foreground")}>
      {children}
    </Slot>
  </Pressable>
);

// 4. Trigger
export const SidebarTrigger = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <Pressable onPress={toggleSidebar} className="p-2 active:opacity-70">
      <PanelLeft size={24} className="text-foreground" />
    </Pressable>
  );
};
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Home, 
  ClipboardList, 
  MessageCircle, 
  Star, 
  User, 
  LayoutDashboard, 
  Briefcase, 
  Wallet 
} from "lucide-react-native";
import { useApp, Screen } from "./AppContext";

const customerTabs: { id: Screen; label: string; icon: any }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "chatList", label: "Chat", icon: MessageCircle },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "profile", label: "Profile", icon: User },
];

const taskerTabs: { id: Screen; label: string; icon: any }[] = [
  { id: "tDashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tJobs", label: "Jobs", icon: Briefcase },
  { id: "tEarnings", label: "Earnings", icon: Wallet },
  { id: "tProfile", label: "Profile", icon: User },
];

const customerMain: Screen[] = ["home", "orders", "chatList", "reviews", "profile"];
const taskerMain: Screen[] = ["tDashboard", "tJobs", "tEarnings", "tProfile"];

export function BottomNav() {
  const { screen, switchTab, chatThreads, role } = useApp();
  const insets = useSafeAreaInsets();

  const tabs = role === "tasker" ? taskerTabs : customerTabs;
  const main = role === "tasker" ? taskerMain : customerMain;

  // Nếu không thuộc màn hình chính thì không hiển thị BottomNav
  if (!main.includes(screen)) return null;

  const unread = chatThreads.reduce((s, c) => s + c.unread, 0);

  const handleTabPress = (tabId: Screen) => {
    if (screen !== tabId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    // Let the press responder finish before swapping screens (avoids Android/Fabric touch lock).
    requestAnimationFrame(() => {
      switchTab(tabId);
    });
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 px-4 pt-2 bg-transparent"
      style={{ paddingBottom: Math.max(insets.bottom, 12), zIndex: 10 }}
      pointerEvents="box-none"
    >
      <View
        className="flex-row items-center justify-around bg-white rounded-[32px] border border-gray-100 shadow-lg px-2 py-2"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {tabs.map((t) => {
          const active = screen === t.id;
          const Icon = t.icon;
          const showBadge = t.id === "chatList" && unread > 0;

          return (
            <Pressable
              key={t.id}
              onPress={() => handleTabPress(t.id)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              className="flex-1 items-center justify-center py-1"
            >
              <View
                className={`w-12 h-12 items-center justify-center rounded-2xl ${
                  active ? "bg-primary/15" : "bg-transparent"
                }`}
              >
                <Icon 
                  size={22} 
                  color={active ? "#2E7D5B" : "#94a3b8"} 
                  strokeWidth={active ? 2.5 : 2} 
                />
                
                {showBadge && (
                  <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-white items-center justify-center">
                    <Text className="text-[9px] font-black text-white">
                      {unread > 9 ? "9+" : unread}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text 
                className={`text-[10px] mt-1 font-bold ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
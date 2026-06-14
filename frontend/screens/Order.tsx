import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  canTrack,
  isFindingTasker,
  needsPayment,
  orderMatchesTab,
} from "@/lib/adapters/statusMaps";
import { canReviewOrder } from "@/lib/adapters/reviewAdapter";
import { PriceBreakdown } from "@/components/pricing/PriceBreakdown";
import { EmptyState } from "@/components/ux/EmptyState";
import { computeOrderPricing } from "@/lib/pricing/orderPricing";
import { OrderListSkeleton } from "@/components/ux/Skeleton";
import { StatusChip } from "@/components/ux/StatusChip";
import { useApp, type Order } from "@/screens/AppContext";
import { Screen, TopBar, Card, Chip, PrimaryButton } from "@/screens/ui";
import {
  Star,
  MapPin,
  MessageCircle,
  Phone,
  ChevronRight,
  Check,
  Clock,
  X,
  AlertCircle,
} from "lucide-react-native";
import Svg, { Rect, Path, Circle, Defs, Pattern } from "react-native-svg";

const { height } = Dimensions.get("window");

function openOrderScreen(
  o: Order,
  navigate: ReturnType<typeof useApp>["navigate"],
  setActiveOrderId: (id?: string) => void,
) {
  setActiveOrderId(o.id);
  if (isFindingTasker(o.apiStatus)) {
    navigate("orderMatching");
    return;
  }
  if (needsPayment(o.apiStatus, o.paymentStatus)) {
    navigate("payment");
    return;
  }
  if (o.status === "completed" || o.apiStatus === "completed") {
    navigate("completed");
    return;
  }
  if (canTrack(o.apiStatus)) {
    navigate("orderDetail");
    return;
  }
  navigate("orderDetail");
}

// --- OrdersScreen ---
export function OrdersScreen() {
  const { orders, navigate, setActiveOrderId, ordersLoading, loadOrders, cancelOrder } = useApp();
  const [tab, setTab] = useState<"upcoming" | "ongoing" | "completed" | "cancelled">("upcoming");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const filtered = orders.filter((o) => orderMatchesTab(o, tab));

  return (
    <Screen className="bg-background">
      <View className="px-5 pt-4 pb-2 bg-white/90">
        <Text className="text-3xl font-black">My Orders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-5 px-5">
          <View className="flex-row gap-2">
            {(["upcoming", "ongoing", "completed", "cancelled"] as const).map((t) => (
              <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </View>

      {ordersLoading && orders.length === 0 ? (
        <OrderListSkeleton />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        refreshing={ordersLoading && orders.length > 0}
        onRefresh={() => loadOrders().catch(() => undefined)}
        ListEmptyComponent={
          <EmptyState
            icon={<AlertCircle size={32} color="#94a3b8" />}
            title={`No ${tab} orders`}
            description="Your bookings will appear here once you schedule a service."
            actionLabel={tab === "upcoming" ? "Browse Services" : undefined}
            onAction={tab === "upcoming" ? () => navigate("home") : undefined}
          />
        }
        renderItem={({ item: o }) => (
          <TouchableOpacity
            onPress={() => openOrderScreen(o, navigate, setActiveOrderId)}
            activeOpacity={0.8}
            className="mb-4"
          >
            <Card className="p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center">
                  <o.service.icon size={24} color="#1e40af" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-base" numberOfLines={1}>{o.service.name}</Text>
                  <Text className="text-xs text-muted-foreground">{o.id} · {o.date}</Text>
                </View>
                <StatusChip label={o.statusLabel ?? o.status} />
              </View>
              <View className="h-[1px] bg-gray-100 my-4" />
              <View className="flex-row items-center gap-3">
                {o.tasker ? (
                  <>
                    <Image source={{ uri: o.tasker.avatar }} className="w-8 h-8 rounded-full" />
                    <Text className="text-xs flex-1">
                      with <Text className="font-bold">{o.tasker.name}</Text>
                    </Text>
                  </>
                ) : (
                  <Text className="text-xs flex-1 text-muted-foreground">
                    {isFindingTasker(o.apiStatus)
                      ? "Finding a nearby tasker…"
                      : "Tasker not assigned yet"}
                  </Text>
                )}
                <Text className="font-black text-primary text-base">${o.total}</Text>
              </View>
              {tab === "upcoming" && o.apiStatus === "pending" && !o.taskerId ? (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    disabled={cancellingOrderId === o.id}
                    onPress={(e) => {
                      e.stopPropagation();
                      setCancellingOrderId(o.id);
                      cancelOrder(o.id)
                        .catch(() => undefined)
                        .finally(() => setCancellingOrderId((current) => (current === o.id ? null : current)));
                    }}
                    className="h-10 rounded-xl bg-red-50 items-center justify-center"
                  >
                    <Text className="font-bold text-red-600">
                      {cancellingOrderId === o.id ? "Cancelling..." : "Cancel Booking"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Card>
          </TouchableOpacity>
        )}
      />
      )}
    </Screen>
  );
}

// --- OrderDetailScreen ---
export function OrderDetailScreen() {
  const {
    orders,
    activeOrderId,
    navigate,
    openChatForOrder,
    cancelOrder,
    refreshOrder,
    reviewedOrderIds,
    setActiveOrderId,
  } = useApp();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const o = orders.find((x) => x.id === activeOrderId) || orders[0];

  if (!o) return null;

  const openChat = () => {
    if (!o.tasker) return;
    openChatForOrder(o.id).catch(() => undefined);
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      await cancelOrder(o.id);
      await refreshOrder(o.id);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    o.apiStatus === "pending" || o.apiStatus === "accepted";

  return (
    <Screen className="bg-background">
      <TopBar title="Order Details" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Card className="p-4 mb-4">
          <View className="flex-row items-center gap-3">
            <View className="w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center">
              <o.service.icon size={28} color="#1e40af" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted-foreground uppercase font-bold">{o.id}</Text>
              <Text className="font-black text-lg">{o.service.name}</Text>
            </View>
            <StatusChip label={o.statusLabel ?? o.status} size="md" />
          </View>
        </Card>

        {needsPayment(o.apiStatus, o.paymentStatus) ? (
          <Card className="p-4 mb-4 bg-orange-50 border-orange-100">
            <Text className="text-sm font-bold text-orange-900">Payment required</Text>
            <Text className="text-xs text-orange-800 mt-1">
              Complete payment to confirm your booking and unlock reviews when finished.
            </Text>
          </Card>
        ) : null}

        {o.tasker ? (
          <Card className="p-4 flex-row items-center gap-3 mb-4">
            <Image source={{ uri: o.tasker.avatar }} className="w-12 h-12 rounded-2xl" />
            <View className="flex-1">
              <Text className="font-bold text-base">{o.tasker.name}</Text>
              <Text className="text-xs text-muted-foreground">
                ⭐ {o.tasker.rating} · {o.tasker.jobs} jobs
              </Text>
            </View>
            <TouchableOpacity
              onPress={openChat}
              className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center"
            >
              <MessageCircle size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
              <Phone size={20} color="#3b82f6" />
            </TouchableOpacity>
          </Card>
        ) : (
          <Card className="p-4 mb-4 bg-secondary/20">
            <Text className="text-sm text-muted-foreground">
              {isFindingTasker(o.apiStatus)
                ? "We are finding a nearby tasker for your service."
                : "Tasker details will appear once assigned."}
            </Text>
          </Card>
        )}

        <Card className="p-4 gap-y-4 mb-4">
          <Row icon={Clock} label="When" value={`${o.date} · ${o.time}`} />
          <Row icon={MapPin} label="Address" value={o.address} />
          {o.notes ? <Row icon={AlertCircle} label="Notes" value={o.notes} /> : null}
        </Card>

        <Card className="p-4 mb-4">
          <Text className="font-black text-base mb-4">Service progress</Text>
          <Timeline apiStatus={o.apiStatus} tabStatus={o.status} />
        </Card>

        <Card className="p-4 mb-4">
          <PriceBreakdown
            pricing={
              o.pricing ??
              computeOrderPricing(
                o.subtotal ?? o.service.price,
                o.bookingType === "instant" ? "instant" : "scheduled",
              )
            }
          />
        </Card>

        {error ? (
          <Text className="text-sm text-red-600 text-center mb-4">{error}</Text>
        ) : null}

        <TouchableOpacity className="w-full py-4 items-center">
          <Text className="text-sm text-muted-foreground">
            Need help? <Text className="text-primary font-bold">Contact support</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="absolute bottom-0 inset-x-0 p-5 bg-white border-t border-border gap-y-2">
        {isFindingTasker(o.apiStatus) && (
          <PrimaryButton onClick={() => navigate("orderMatching")}>
            View Matching Status
          </PrimaryButton>
        )}
        {needsPayment(o.apiStatus, o.paymentStatus) && (
          <PrimaryButton onClick={() => navigate("payment")}>Pay Now</PrimaryButton>
        )}
        {canTrack(o.apiStatus) && !needsPayment(o.apiStatus, o.paymentStatus) && (
          <PrimaryButton onClick={() => navigate("tracking")}>Track Order</PrimaryButton>
        )}
        {canReviewOrder(o, reviewedOrderIds) && (
          <PrimaryButton
            onClick={() => {
              setActiveOrderId(o.id);
              navigate("submitReview");
            }}
          >
            Leave a Review
          </PrimaryButton>
        )}
        {canCancel && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelling}
            className="w-full h-12 items-center justify-center"
          >
            <Text className="font-bold text-red-500">
              {cancelling ? "Cancelling…" : "Cancel Booking"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Screen>
  );
}

// --- TrackingScreen ---
export function TrackingScreen() {
  const { orders, activeOrderId, navigate, openChatForOrder, socketStatus } = useApp();
  const liveUpdates = socketStatus === "connected";
  const o = orders.find((x) => x.id === activeOrderId) || orders[0];

  if (!o) return null;

  if (!o.tasker) {
    return (
      <Screen className="bg-background items-center justify-center px-8">
        <Text className="text-muted-foreground text-center">
          Tracking is available after a tasker accepts your order.
        </Text>
        <PrimaryButton
          onClick={() =>
            isFindingTasker(o.apiStatus) ? navigate("orderMatching") : navigate("orderDetail")
          }
          className="mt-6"
        >
          {isFindingTasker(o.apiStatus) ? "View Matching" : "Order Details"}
        </PrimaryButton>
      </Screen>
    );
  }

  return (
    <Screen className="bg-background">
      <View style={{ height: height * 0.55 }} className="bg-emerald-50 relative">
        <TouchableOpacity
          onPress={() => navigate("orders")}
          className="absolute top-12 left-4 z-20 w-10 h-10 rounded-full bg-white shadow-md items-center justify-center"
        >
          <X size={20} color="black" />
        </TouchableOpacity>

        <Svg height="100%" width="100%" viewBox="0 0 400 600">
          <Defs>
            <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A8E6CF" strokeWidth="0.5" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" />
          <Path
            d="M 40 500 Q 150 400 200 350 T 360 100"
            stroke="#2E7D5B"
            strokeWidth="4"
            strokeDasharray="8 6"
            fill="none"
          />
          <Circle cx="40" cy="500" r="10" fill="#2E7D5B" />
          <Circle cx="360" cy="100" r="14" fill="#A8E6CF" stroke="#2E7D5B" strokeWidth="3" />
        </Svg>

        <View
          style={{ position: "absolute", top: "45%", right: "20%" }}
          className="items-center"
        >
          <View className="bg-white p-1 rounded-full shadow-lg border-2 border-primary">
            <Image source={{ uri: o.tasker.avatar }} className="w-12 h-12 rounded-full" />
          </View>
          <View className="bg-primary px-2 py-1 rounded-lg mt-1">
            <Text className="text-white text-[10px] font-bold">Tasker</Text>
          </View>
        </View>
      </View>

      <View className="-mt-8 flex-1 bg-white rounded-t-[40px] px-5 pt-6">
        <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-4" />

        {liveUpdates ? (
          <View className="flex-row items-center justify-center gap-2 mb-4 py-2 rounded-full bg-emerald-50 self-center px-4">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text className="text-[11px] font-bold text-emerald-800">Live tracking updates</Text>
          </View>
        ) : null}

        <View className="flex-row items-center gap-4 mb-6">
          <Image source={{ uri: o.tasker.avatar }} className="w-16 h-16 rounded-2xl" />
          <View className="flex-1">
            <Text className="font-black text-lg">{o.tasker.name}</Text>
            <Text className="text-xs text-muted-foreground">
              {o.apiStatus === "arrived"
                ? "Tasker has arrived"
                : o.apiStatus === "in_progress"
                  ? "Service in progress"
                  : (
                    <>
                      En route · <Text className="font-bold text-primary">~12 min</Text>
                    </>
                  )}
            </Text>
          </View>
          <TouchableOpacity className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
            <MessageCircle size={22} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity className="w-12 h-12 rounded-full bg-primary items-center justify-center">
            <Phone size={22} color="white" />
          </TouchableOpacity>
        </View>

        <Card className="p-4 mb-4">
          <Timeline apiStatus={o.apiStatus} tabStatus={o.status} />
        </Card>

        {needsPayment(o.apiStatus, o.paymentStatus) && (
          <PrimaryButton onClick={() => navigate("payment")} className="mb-3">
            Complete Payment
          </PrimaryButton>
        )}

        <TouchableOpacity
          onPress={() => navigate("orderDetail")}
          className="w-full h-14 rounded-2xl border-2 border-gray-100 flex-row items-center justify-center gap-2"
        >
          <Text className="font-bold text-base">View Details</Text>
          <ChevronRight size={18} color="black" />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

// --- CompletedScreen ---
export function CompletedScreen() {
  const { navigate, orders, activeOrderId, reviewedOrderIds, setActiveOrderId } = useApp();
  const o = orders.find((x) => x.id === activeOrderId) || orders[0];
  const showReview = o ? canReviewOrder(o, reviewedOrderIds) : false;

  return (
    <Screen className="bg-background">
      <View className="flex-1 items-center justify-center px-10">
        <View className="w-24 h-24 rounded-full bg-emerald-100 items-center justify-center mb-6">
          <Check size={48} color="#059669" />
        </View>
        <Text className="text-2xl font-black text-center mb-2">Service Completed!</Text>
        <Text className="text-muted-foreground text-center mb-10">
          Your task has been finished. Thank you for using TaskGo!
        </Text>

        {showReview && o ? (
          <PrimaryButton
            onClick={() => {
              setActiveOrderId(o.id);
              navigate("submitReview");
            }}
            className="mb-4"
          >
            Leave a Review
          </PrimaryButton>
        ) : null}
        <TouchableOpacity
          onPress={() => navigate("home")}
          className="w-full h-14 rounded-2xl bg-gray-100 items-center justify-center"
        >
          <Text className="font-bold text-gray-600">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
        <Icon size={18} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-muted-foreground font-bold uppercase">{label}</Text>
        <Text className="font-bold text-sm text-foreground">{value}</Text>
      </View>
    </View>
  );
}

const steps = [
  "Request published",
  "Tasker assigned",
  "On the way",
  "In progress",
  "Payment",
  "Completed",
];

function timelineIndex(apiStatus?: string, tabStatus?: string): number {
  switch (apiStatus) {
    case "pending":
      return 0;
    case "accepted":
      return 1;
    case "arrived":
      return 2;
    case "in_progress":
      return 3;
    case "pending_payment":
      return 4;
    case "completed":
      return 6;
    case "cancelled":
      return -1;
    default:
      if (tabStatus === "completed") return 6;
      if (tabStatus === "ongoing") return 3;
      return 1;
  }
}

function Timeline({
  apiStatus,
  tabStatus,
}: {
  apiStatus?: string;
  tabStatus?: string;
}) {
  const currentIdx = timelineIndex(apiStatus, tabStatus);
  if (currentIdx < 0) {
    return (
      <Text className="text-sm text-red-600 font-bold">This order was cancelled.</Text>
    );
  }

  return (
    <View className="gap-y-0">
      {steps.map((step, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <View key={step} className="flex-row gap-4">
            <View className="items-center">
              <View
                className={`w-7 h-7 rounded-full items-center justify-center ${
                  isDone || isActive ? "bg-primary" : "bg-gray-100"
                }`}
              >
                {isDone ? (
                  <Check size={14} color="white" strokeWidth={3} />
                ) : (
                  <Text
                    className={`text-[10px] font-bold ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < steps.length - 1 && (
                <View className={`w-[2px] h-6 ${isDone ? "bg-primary" : "bg-gray-100"}`} />
              )}
            </View>
            <Text
              className={`text-sm mt-1 ${
                isDone || isActive ? "font-bold text-foreground" : "text-gray-400"
              }`}
            >
              {step}
              {isActive ? " · now" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

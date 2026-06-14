import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  View,
  Text,
  Image,
  Dimensions,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useApp } from "@/screens/AppContext";
import { DEFAULT_AVATAR } from "@/lib/auth/mapUser";
import { formatHomeLocation, getDefaultAddressLatLng } from "@/lib/profile/addresses";
import { Screen, Card, Chip, PrimaryButton } from "@/screens/ui";
import { promos, type Tasker } from "@/screens/data";
import { filterServicesByCategory } from "@/lib/adapters/catalogAdapter";
import { HOME_CATEGORY_GRID } from "@/lib/constants/categories";
import { useHomeServices } from "@/lib/hooks/use-home-services";
import { useRecommendedTaskers } from "@/lib/hooks/use-recommended-taskers";
import { useNearbyTopTaskers } from "@/lib/hooks/use-nearby-top-taskers";
import { SkeletonBox } from "@/components/ux/Skeleton";
import { EmptyState } from "@/components/ux/EmptyState";
import { Package, Users } from "lucide-react-native";
import { getCurrentPendingPaymentOrderRequest } from "@/lib/api/orders";
import { createPayOSCheckoutLinkRequest } from "@/lib/api/payments";
import type { OrderDTO } from "@/lib/api/types";
import { WebView } from "react-native-webview";
import { 
  Bell, Search, MapPin, Star, ChevronRight, 
  Sparkles, ArrowLeft, SlidersHorizontal, X 
} from "lucide-react-native";

const { width } = Dimensions.get('window');

function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")} VND`;
}

export function HomeScreen() {
  const {
    navigate,
    role,
    isAuthenticated,
    user,
    setSelectedService,
    setSelectedTasker,
    startCategoryBooking,
    catalogServices,
    addresses,
  } = useApp();

  const homeLocationLabel = formatHomeLocation(addresses);

  const {
    services: popularServices,
    loading: servicesLoading,
    reload: reloadServices,
  } = useHomeServices();
  const {
    taskers: recommendedTaskers,
    loading: recommendedLoading,
    reload: reloadRecommended,
  } = useRecommendedTaskers(5);
  const customerLocation = getDefaultAddressLatLng(addresses);
  const {
    taskers: nearbyTopTaskers,
    loading: nearbyLoading,
    reload: reloadNearby,
  } = useNearbyTopTaskers(customerLocation, 3);
  const [unpaidOrder, setUnpaidOrder] = useState<OrderDTO | null>(null);
  const [checkingUnpaid, setCheckingUnpaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || role !== "customer") return;
    let cancelled = false;
    setCheckingUnpaid(true);
    getCurrentPendingPaymentOrderRequest()
      .then((order) => {
        if (!cancelled) setUnpaidOrder(order);
      })
      .catch(() => {
        if (!cancelled) setUnpaidOrder(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingUnpaid(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role]);

  const openPayOSWebView = async () => {
    if (!unpaidOrder?.id || paying) return;
    setPaying(true);
    try {
      const link = await createPayOSCheckoutLinkRequest(unpaidOrder.id);
      console.log("👉 [PAYOS DEBUG] Received payment response from backend:", link);
      if (link && link.checkoutUrl) {
        console.log("🚀 [PAYOS SUCCESS] Opening PayOS link in system browser:", link.checkoutUrl);

        // Clear the unpaid modal state so it's gone when the customer returns
        setUnpaidOrder(null);

        // Launch Safari/Chrome immediately
        Linking.openURL(link.checkoutUrl).catch((err) => {
          console.error("Failed to open URL:", err);
          Alert.alert("Browser Error", "Could not open the banking payment link.");
        });
      } else {
        Alert.alert("Error", "PayOS Checkout URL is missing from server response.");
      }
    } catch (err) {
      Alert.alert("Payment Error", err instanceof Error ? err.message : "Could not create payment link.");
    } finally {
      setPaying(false);
    }
  };

  const handlePaymentNavigation = (url: string) => {
    if (!url) return;
    const normalized = url.toLowerCase();
    const isReturn =
      normalized.startsWith("taskgo://payment/return") ||
      normalized.includes("/payment/return");
    const isCancel =
      normalized.startsWith("taskgo://payment/cancel") ||
      normalized.includes("/payment/cancel");

    if (isReturn) {
      setCheckoutUrl(null);
      setUnpaidOrder(null);
      Alert.alert("Payment Success", "Your payment has been completed successfully.");
      return;
    }
    if (isCancel) {
      setCheckoutUrl(null);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    const pool = catalogServices.length > 0 ? catalogServices : popularServices;
    startCategoryBooking(categoryId, pool);
  };

  return (
    <>
    <Screen className="bg-background">
      {/* Header Section */}
      <View className="px-5 pt-4 pb-3 bg-white/85">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: user.avatar || DEFAULT_AVATAR }}
            className="w-10 h-10 rounded-full border-2 border-border bg-muted"
          />
          <View className="flex-1">
            <Text className="text-[11px] text-muted-foreground font-medium">Hello, {user.name.split(" ")[0]} 👋</Text>
            <TouchableOpacity
              onPress={() => navigate("addresses")}
              className="flex-row items-center gap-1 mt-0.5"
            >
              <MapPin size={14} color="#2E7D5B" />
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                {homeLocationLabel}
              </Text>
              <ChevronRight size={14} color="#94a3b8" style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <Bell size={20} color="#1A2421" />
            <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigate("search")}
          activeOpacity={0.8}
          className="mt-4 w-full h-12 rounded-2xl bg-muted/60 px-4 flex-row items-center gap-3"
        >
          <Search size={18} color="#94a3b8" />
          <Text className="text-muted-foreground text-sm">Search for cleaning, plumbing…</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-5 mt-2 space-y-7 pb-10">
          
          {/* Promotions Carousel */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            snapToInterval={width * 0.85 + 12}
            decelerationRate="fast"
            className="-mx-5 px-5"
          >
            <View className="flex-row gap-3">
              {promos.map((p) => (
                <View 
                  key={p.id} 
                  style={{ width: width * 0.85 }}
                  className={`rounded-[32px] p-5 relative overflow-hidden bg-mint`}
                >
                  <Sparkles size={100} color="rgba(46, 125, 91, 0.05)" className="absolute -right-6 -bottom-6" />
                  <Text className="text-[10px] font-black uppercase text-primary/60 tracking-widest">{p.subtitle}</Text>
                  <Text className="text-xl font-black mt-1 text-primary w-[70%]">{p.title}</Text>
                  <TouchableOpacity className="mt-4 bg-white self-start px-5 py-2 rounded-full shadow-sm">
                    <Text className="text-primary font-bold text-xs">Claim Now</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Categories Grid */}
          <View>
            <SectionHeader title="Categories" action="See all" onAction={() => navigate("category")} />
            <View className="flex-row flex-wrap mt-4 justify-between">
              {HOME_CATEGORY_GRID.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleCategoryPress(c.id)}
                  className="w-[22%] items-center mb-5"
                >
                  <View className="w-14 h-14 rounded-[20px] bg-secondary items-center justify-center shadow-sm">
                    <c.icon size={24} color="#2E7D5B" />
                  </View>
                  <Text className="text-[10px] font-bold text-center mt-2 leading-tight h-8 text-foreground" numberOfLines={2}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Popular Services Horizontal */}
          <View>
            <SectionHeader title="Popular services" action="See all" onAction={() => navigate("category")} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5 mt-4">
              <View className="flex-row gap-3">
                {servicesLoading ? (
                  [1, 2, 3].map((i) => (
                    <SkeletonBox key={i} className="w-52 h-40 rounded-2xl" />
                  ))
                ) : popularServices.length === 0 ? (
                  <EmptyState
                    icon={<Package size={28} color="#94a3b8" />}
                    title="No services yet"
                    description="Pull to refresh or try again later."
                    actionLabel="Retry"
                    onAction={() => void reloadServices()}
                  />
                ) : null}
                {!servicesLoading &&
                  popularServices.map((s) => (
                  <TouchableOpacity 
                    key={s.id} 
                    onPress={() => { setSelectedService(s); navigate("serviceDetail"); }}
                    activeOpacity={0.9}
                  >
                    <Card className="w-52 p-4">
                      <View className="h-28 rounded-2xl bg-secondary/50 items-center justify-center mb-3">
                        <s.icon size={40} color="#2E7D5B" />
                      </View>
                      <Text className="font-bold text-sm text-foreground" numberOfLines={1}>{s.name}</Text>
                      <View className="flex-row items-center justify-between mt-2">
                        <View className="flex-row items-center gap-1">
                          <Star size={12} color="#fbbf24" fill="#fbbf24" />
                          <Text className="text-xs text-muted-foreground">{s.rating}</Text>
                        </View>
                        <Text className="font-black text-primary">${s.price}</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
          </View>

          {/* Recommended Taskers */}
          <View>
            <SectionHeader title="Recommended taskers" action="See all" onAction={() => navigate("taskerList")} />
            <View className="mt-4 gap-y-3">
              {recommendedLoading ? (
                [1, 2, 3, 4, 5].map((i) => <SkeletonBox key={i} className="h-20 w-full rounded-2xl" />)
              ) : recommendedTaskers.length === 0 ? (
                <EmptyState
                  icon={<Users size={28} color="#94a3b8" />}
                  title="No taskers yet"
                  description="Check back soon for verified pros."
                  actionLabel="Retry"
                  onAction={() => void reloadRecommended()}
                />
              ) : (
                recommendedTaskers.map((t) => (
                  <TaskerHomeCard
                    key={`rec-${t.id}`}
                    tasker={t}
                    onPress={() => {
                      setSelectedTasker(t);
                      navigate("taskerProfile");
                    }}
                  />
                ))
              )}
            </View>
          </View>

          {/* Top rated near you */}
          <View>
            <SectionHeader title="Top rated near you" />
            <View className="mt-4 gap-y-3">
              {nearbyLoading ? (
                [1, 2, 3].map((i) => <SkeletonBox key={i} className="h-20 w-full rounded-2xl" />)
              ) : nearbyTopTaskers.length === 0 ? (
                <EmptyState
                  icon={<Users size={28} color="#94a3b8" />}
                  title="No taskers nearby"
                  description="Verified taskers will appear here when available."
                  actionLabel="Retry"
                  onAction={() => void reloadNearby()}
                />
              ) : (
                nearbyTopTaskers.map((t) => (
                  <TaskerHomeCard
                    key={`nearby-${t.id}`}
                    tasker={t}
                    onPress={() => {
                      setSelectedTasker(t);
                      navigate("taskerProfile");
                    }}
                  />
                ))
              )}
            </View>
          </View>

        </View>
      </ScrollView>
    </Screen>
    <Modal
      visible={Boolean(unpaidOrder)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-[85%] max-h-[80%] rounded-3xl bg-white p-6">
          <Text className="text-xl font-black text-red-600 mb-4">Unpaid Order Detected!</Text>
          <Text className="text-base leading-6 text-foreground mb-6">
            Your previous job "{unpaidOrder?.serviceName}" has been completed by the Tasker. Please
            settle the payment of {formatVnd(unpaidOrder?.pricing?.total ?? unpaidOrder?.subtotal ?? 0)} to
            continue using our services.
          </Text>
          <PrimaryButton onClick={openPayOSWebView} disabled={paying || checkingUnpaid} loading={paying}>
            Pay Now via PayOS
          </PrimaryButton>
        </View>
      </View>
    </Modal>
    <Modal
      animationType="slide"
      transparent={false}
      visible={!!checkoutUrl}
      onRequestClose={() => setCheckoutUrl("")}
    >
      <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: 60 }}>
        <View
          style={{
            height: 50,
            borderBottomWidth: 1,
            borderColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity onPress={() => setCheckoutUrl("")} style={{ padding: 10 }}>
            <Text style={{ color: "#ff0000", fontSize: 16, fontWeight: "bold" }}>✕ Close Payment</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: "600", marginLeft: 20 }}>PayOS Secure Checkout</Text>
        </View>

        <WebView
          source={{ uri: checkoutUrl ?? "" }}
          style={{ flex: 1 }}
          containerStyle={{ flex: 1 }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onNavigationStateChange={(state) => handlePaymentNavigation(state.url)}
        />
      </View>
    </Modal>
    </>
  );
}

// --- CategoryScreen ---
export function CategoryScreen() {
  const {
    navigate,
    selectedCategory,
    setSelectedCategory,
    setSelectedService,
    setSelectedTasker,
    booking,
    setBooking,
    catalogServices,
    catalogCategories,
    catalogLoading,
    reloadCatalog,
  } = useApp();
  const [sort, setSort] = useState("Popular");
  const filtered = filterServicesByCategory(catalogServices, selectedCategory);

  const openService = (s: (typeof catalogServices)[number]) => {
    setSelectedTasker(undefined);
    setSelectedService(s);
    setBooking({ ...booking, service: s });
    navigate("serviceDetail");
  };

  return (
    <Screen className="bg-background">
      <View className="bg-white border-b border-border">
        <View className="flex-row items-center px-4 h-14">
          <TouchableOpacity onPress={() => navigate("home")} className="w-10 h-10 items-center justify-center -ml-2">
            <ArrowLeft size={22} color="black" />
          </TouchableOpacity>
          <Text className="font-black text-lg flex-1">All Services</Text>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <SlidersHorizontal size={18} color="black" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3">
          <View className="flex-row gap-2">
            <Chip active={!selectedCategory} onClick={() => setSelectedCategory(undefined)}>All</Chip>
            {catalogCategories.map((c) => (
              <Chip key={c.id} active={selectedCategory === c.id} onClick={() => setSelectedCategory(c.id)}>{c.name}</Chip>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          !catalogLoading ? (
            <View className="px-5 pt-8">
              <EmptyState
                icon={<Package size={28} color="#94a3b8" />}
                title={selectedCategory ? "No services in this category" : "No services yet"}
                description="Try another category or refresh the catalog."
                actionLabel="Refresh"
                onAction={() => void reloadCatalog()}
              />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View className="flex-row justify-between px-5 mt-4">
            <Text className="text-sm text-muted-foreground">
              {catalogLoading ? "Loading…" : `${filtered.length} results`}
            </Text>
            <Text className="text-sm font-bold text-primary">{sort}</Text>
          </View>
        }
        renderItem={({ item: s }) => (
          <TouchableOpacity 
            onPress={() => openService(s)}
            style={{ width: '48%' }}
          >
            <Card className="p-3">
              <View className="h-24 rounded-2xl bg-blue-50 items-center justify-center mb-2">
                <s.icon size={36} color="#1e40af" />
              </View>
              <Text className="font-bold text-sm" numberOfLines={1}>{s.name}</Text>
              <Text className="text-[10px] text-muted-foreground">{s.duration}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center gap-1">
                  <Star size={10} color="#fbbf24" fill="#fbbf24" />
                  <Text className="text-[10px] text-muted-foreground">{s.rating}</Text>
                </View>
                <Text className="font-black text-primary text-sm">${s.price}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

// --- SearchScreen ---
export function SearchScreen() {
  const { navigate, setSelectedService, catalogServices, catalogLoading } = useApp();
  const [q, setQ] = useState("");
  const results = q
    ? catalogServices.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : catalogServices;
  const recent = ["AC repair", "Deep cleaning", "Painter"];

  return (
    <Screen className="bg-background">
      <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-white">
        <TouchableOpacity onPress={() => navigate("home")} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} color="black" />
        </TouchableOpacity>
        <View className="flex-1 relative justify-center">
          <Search size={18} color="#9ca3af" className="absolute left-4 z-10" />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search services…"
            className="w-full h-11 pl-11 pr-10 rounded-2xl bg-muted text-sm"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ("")} className="absolute right-3 bg-gray-200 rounded-full p-1">
              <X size={12} color="black" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="px-5 pt-4">
        {!q && (
          <View className="mb-6">
            <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase">Recent searches</Text>
            <View className="flex-row flex-wrap gap-2">
              {recent.map((r) => <Chip key={r} onClick={() => setQ(r)}>{r}</Chip>)}
            </View>
          </View>
        )}
        
        <Text className="text-xs text-muted-foreground mb-4">
          {catalogLoading ? "Loading…" : `${results.length} results`}
        </Text>

        {catalogLoading ? (
          <SkeletonBox className="h-16 w-full rounded-2xl mb-3" />
        ) : null}

        {!catalogLoading &&
          results.map((s) => (
          <TouchableOpacity 
            key={s.id} 
            onPress={() => { setSelectedService(s); navigate("serviceDetail"); }}
            className="mb-3"
          >
            <Card className="p-3 flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center">
                <s.icon size={28} color="#1e40af" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm">{s.name}</Text>
                <Text className="text-xs text-muted-foreground">{s.duration} · ${s.price}</Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

// --- ServiceDetailScreen ---
export function ServiceDetailScreen() {
  const { selectedService, navigate, back } = useApp();
  const s = selectedService!;
  if (!s) return null;

  return (
    <Screen className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="h-72 bg-blue-100 items-center justify-center relative">
          <TouchableOpacity 
            onPress={back} 
            className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-md z-20"
          >
            <ArrowLeft size={20} color="black" />
          </TouchableOpacity>
          <s.icon size={120} color="rgba(30, 64, 175, 0.2)" />
        </View>

        <View className="-mt-8 bg-white rounded-t-[40px] px-5 pt-8 pb-32">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-black">{s.name}</Text>
              <View className="flex-row items-center gap-3 mt-2">
                <View className="flex-row items-center gap-1">
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Text className="text-sm font-bold">{s.rating} ({s.reviews})</Text>
                </View>
                <Text className="text-muted-foreground">·</Text>
                <Text className="text-sm text-muted-foreground">{s.duration}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted-foreground font-bold uppercase">From</Text>
              <Text className="text-3xl font-black text-primary">${s.price}</Text>
            </View>
          </View>

          <Text className="text-base text-muted-foreground mt-6 leading-6">{s.description}</Text>

          <Text className="font-black text-lg mt-8 mb-4">What's included</Text>
          <View className="gap-y-3">
            {s.includes.map((item, idx) => (
              <View key={idx} className="flex-row items-center gap-3">
                <View className="w-6 h-6 rounded-full bg-blue-50 items-center justify-center">
                  <Sparkles size={12} color="#3b82f6" />
                </View>
                <Text className="text-sm font-medium text-gray-700">{item}</Text>
              </View>
            ))}
          </View>

          <Text className="font-black text-lg mt-8 mb-4">Recent Reviews</Text>
          <Card className="p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Image source={{ uri: "https://i.pravatar.cc/100?img=21" }} className="w-10 h-10 rounded-full" />
              <View className="flex-1">
                <Text className="font-bold text-sm">Jane D.</Text>
                <View className="flex-row">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} color="#fbbf24" fill="#fbbf24" />)}
                </View>
              </View>
              <Text className="text-xs text-muted-foreground">3d ago</Text>
            </View>
            <Text className="text-sm text-muted-foreground italic">"Excellent work, my place looks brand new!"</Text>
          </Card>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 inset-x-0 p-5 bg-white border-t border-border gap-2">
        <PrimaryButton onClick={() => navigate("bookingForm")}>Book Service</PrimaryButton>
        <TouchableOpacity onPress={() => navigate("taskerList")} className="w-full h-10 items-center justify-center">
          <Text className="text-sm font-bold text-primary">Browse taskers & reviews</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

// --- Helper Components ---
function TaskerHomeCard({
  tasker,
  onPress,
}: {
  tasker: Tasker;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card className="p-3 flex-row items-center gap-3">
        <Image source={{ uri: tasker.avatar }} className="w-14 h-14 rounded-2xl" />
        <View className="flex-1">
          <Text className="font-bold text-base">{tasker.name}</Text>
          <Text className="text-[11px] text-muted-foreground">
            {tasker.jobs} jobs · {tasker.distanceKm} km
          </Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Star size={12} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-xs font-bold">{tasker.rating}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-muted-foreground">From</Text>
          <Text className="font-black text-primary text-base">${tasker.hourly}/h</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, action, onAction }: any) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xl font-black">{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-sm font-bold text-primary">{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
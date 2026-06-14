import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CatalogService } from "@/lib/adapters/catalogAdapter";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  buildBookingWindow,
  resolveServiceDurationMinutes,
} from "@/lib/scheduling/bookingWindow";
import {
  formatDisplayDate,
  formatTimeSlot,
  getDefaultScheduledSlot,
  roundToNextQuarterHour,
  validateScheduledSlot,
} from "@/lib/scheduling/localDateTime";
import {
  BookingSchedulePicker,
  type ScheduleMode,
} from "@/components/booking/BookingSchedulePicker";
import { PriceBreakdown } from "@/components/pricing/PriceBreakdown";
import { computeOrderPricing } from "@/lib/pricing/orderPricing";
import { listMarketplaceTaskersRequest } from "@/lib/api/taskers";
import { isMarketplaceTasker, userDtoToCatalogTasker } from "@/lib/adapters/catalogAdapter";
import { canTrack, isFindingTasker, needsPayment } from "@/lib/adapters/statusMaps";
import { isPaymentFailedError } from "@/lib/api/errors";
import { payOrderRequest } from "@/lib/api/payments";
import { createIdempotencyKey } from "@/lib/idempotency";
import { showAppToast } from "@/components/ux/toast";
import { useApp } from "@/screens/AppContext";
import { Screen, TopBar, Card, Chip, PrimaryButton, Field, Input } from "@/screens/ui";
import { SkeletonBox } from "@/components/ux/Skeleton";
import { EmptyState } from "@/components/ux/EmptyState";
import { Users } from "lucide-react-native";
import {
  Star, Shield, MapPin, Calendar, Clock, ImagePlus, ChevronRight, Check,
  Wallet, Banknote, CreditCard, Smartphone, Tag, Sparkles, Download, Share2, ArrowLeft,
} from "lucide-react-native";

// --- TaskerListScreen ---
export function TaskerListScreen() {
  const {
    navigate,
    setSelectedTasker,
    selectedService,
    catalogTaskers,
    catalogLoading,
    reloadCatalog,
    booking,
  } = useApp();
  const [sort, setSort] = useState("Recommended");
  const [filteredTaskers, setFilteredTaskers] = useState(catalogTaskers);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (!booking.scheduledDateIso || !booking.time || !selectedService) {
      setFilteredTaskers(catalogTaskers);
      return;
    }
    const durationMinutes = resolveServiceDurationMinutes(selectedService);
    const window = buildBookingWindow({
      bookingType: "scheduled",
      scheduledDateIso: booking.scheduledDateIso,
      time: booking.time,
      durationMinutes,
    });
    let cancelled = false;
    setListLoading(true);
    listMarketplaceTaskersRequest({
      scheduledStart: window.startIso,
      scheduledEnd: window.endIso,
    })
      .then((rows) => {
        if (cancelled) return;
        setFilteredTaskers(
          rows.filter(isMarketplaceTasker).map((u, i) => userDtoToCatalogTasker(u, i)),
        );
      })
      .catch(() => {
        if (!cancelled) setFilteredTaskers(catalogTaskers);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [booking.scheduledDateIso, booking.time, selectedService, catalogTaskers]);

  const sorted = [...filteredTaskers].sort((a, b) =>
    sort === "Rating" ? b.rating - a.rating : b.jobs - a.jobs,
  );

  return (
    <Screen className="bg-background">
      <TopBar title="Browse Taskers" />
      <ScrollView className="px-5 py-4">
        {selectedService && (
          <Card className="p-3 flex-row items-center gap-3 mb-4 bg-secondary/40 border-0">
            <View className={`w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center`}>
              <selectedService.icon size={20} color="#065f46" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted-foreground uppercase">Selected service</Text>
              <Text className="font-bold text-sm">{selectedService.name}</Text>
            </View>
          </Card>
        )}

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm text-muted-foreground">
            {catalogLoading || listLoading
              ? "Loading taskers…"
              : `${filteredTaskers.length} verified taskers available for your slot`}
          </Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-sm font-bold text-primary">{sort}</Text>
          </TouchableOpacity>
        </View>

        <View className="pb-10">
          {catalogLoading || listLoading ? (
            [1, 2, 3].map((i) => <SkeletonBox key={i} className="h-28 w-full rounded-2xl mb-3" />)
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={<Users size={28} color="#94a3b8" />}
              title="No taskers available"
              description="Verified taskers will appear here when they join the marketplace."
              actionLabel="Refresh"
              onAction={() => void reloadCatalog()}
            />
          ) : (
            sorted.map((t) => (
            <Card key={t.id} className="p-4 mb-3">
              <View className="flex-row gap-3">
                <View>
                  <Image source={{ uri: t.avatar }} className="w-16 h-16 rounded-2xl" />
                  {t.online && <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-bold text-base" numberOfLines={1}>{t.name}</Text>
                    {t.verified && <Shield size={14} color="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />}
                  </View>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="flex-row items-center gap-1">
                      <Star size={12} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-xs text-muted-foreground">{t.rating}</Text>
                    </View>
                    <Text className="text-muted-foreground">·</Text>
                    <Text className="text-xs text-muted-foreground">{t.jobs} jobs</Text>
                    <Text className="text-muted-foreground">·</Text>
                    <View className="flex-row items-center gap-1">
                      <MapPin size={12} color="#6b7280" />
                      <Text className="text-xs text-muted-foreground">{t.distanceKm}km</Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {t.badges.map((b) => (
                      <View key={b} className="px-2 py-0.5 rounded-full bg-secondary">
                        <Text className="text-[10px] font-bold text-emerald-800">{b}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-primary text-lg">${t.hourly}</Text>
                  <Text className="text-[10px] text-muted-foreground">/hour</Text>
                </View>
              </View>
              <View className="flex-row gap-2 mt-4">
                <TouchableOpacity 
                  onPress={() => { setSelectedTasker(t); navigate("taskerProfile"); }}
                  className="flex-1 h-10 rounded-xl border border-border items-center justify-center"
                >
                  <Text className="font-bold text-sm">View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setSelectedTasker(t); navigate("bookingForm"); }}
                  className="flex-1 h-10 rounded-xl bg-primary items-center justify-center"
                >
                  <Text className="font-bold text-sm text-white">Prefer</Text>
                </TouchableOpacity>
              </View>
            </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- TaskerProfileScreen ---
export function TaskerProfileScreen() {
  const {
    selectedTasker,
    selectedService,
    navigate,
    back,
    setBooking,
    setSelectedTasker,
    taskerReviewsCache,
    taskerReviewsLoading,
    loadTaskerReviews,
    setActiveTaskerProfileId,
  } = useApp();
  const insets = useSafeAreaInsets();
  const t = selectedTasker;
  if (!t) return null;

  const backendTaskerId = t.userId ?? t.id;
  const reviewsView = taskerReviewsCache[backendTaskerId];
  const displayRating = reviewsView?.averageRating ?? t.rating;
  const displayJobs = reviewsView?.totalReviews ?? t.jobs;

  React.useEffect(() => {
    setActiveTaskerProfileId(backendTaskerId);
    loadTaskerReviews(backendTaskerId).catch(() => undefined);
    return () => setActiveTaskerProfileId(undefined);
  }, [backendTaskerId, loadTaskerReviews, setActiveTaskerProfileId]);

  const footerPad = insets.bottom + 20;

  return (
    <Screen className="bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerPad + 80 }}
      >
        <View className="px-5 pt-2">
          <TouchableOpacity
            onPress={back}
            className="w-10 h-10 -ml-1 mb-4 rounded-full bg-card border border-border items-center justify-center"
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#1A2421" />
          </TouchableOpacity>

          <View className="flex-row items-end gap-4">
            <Image source={{ uri: t.avatar }} className="w-24 h-24 rounded-[30px] border-2 border-border" />
            <View className="pb-2">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xl font-black">{t.name}</Text>
                {t.verified && <Shield size={18} color="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />}
              </View>
              <Text className="text-xs text-muted-foreground">{t.online ? "Online now" : "Offline"}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-6">
            <StatCard label="Rating" val={displayRating} icon={Star} />
            <StatCard label="Reviews" val={displayJobs} icon={Check} />
            <StatCard label="Hour" val={`$${t.hourly}`} icon={Wallet} />
          </View>

          <Text className="font-bold text-lg mt-6 mb-2">About</Text>
          <Text className="text-sm text-muted-foreground leading-5">{t.bio}</Text>

          <Text className="font-bold text-lg mt-6 mb-3">Portfolio</Text>
          <View className="flex-row flex-wrap gap-2">
            {t.portfolio.map((p, i) => (
              <Image key={i} source={{ uri: p }} className="w-[31%] aspect-square rounded-xl bg-muted" />
            ))}
          </View>

          <Text className="font-bold text-lg mt-6 mb-3">Available today</Text>
          <View className="flex-row flex-wrap gap-2">
            {t.availability.map((a) => <Chip key={a}>{a}</Chip>)}
          </View>

          <Text className="font-bold text-lg mt-6 mb-3">Reviews</Text>
          {taskerReviewsLoading && !reviewsView ? (
            <Card className="p-4 items-center">
              <Text className="text-sm text-muted-foreground">Loading reviews…</Text>
            </Card>
          ) : reviewsView && reviewsView.reviews.length > 0 ? (
            reviewsView.reviews.slice(0, 5).map((r) => (
              <Card key={r.id} className="p-4 mb-3">
                <View className="flex-row items-center gap-3 mb-2">
                  {r.customerAvatar ? (
                    <Image source={{ uri: r.customerAvatar }} className="w-9 h-9 rounded-full" />
                  ) : (
                    <View className="w-9 h-9 rounded-full bg-muted" />
                  )}
                  <View className="flex-1">
                    <Text className="font-bold text-sm">{r.customerName}</Text>
                    <View className="flex-row">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={10}
                          color={i <= r.rating ? "#fbbf24" : "#e5e7eb"}
                          fill={i <= r.rating ? "#fbbf24" : "transparent"}
                        />
                      ))}
                    </View>
                  </View>
                  <Text className="text-xs text-muted-foreground">{r.date}</Text>
                </View>
                {r.comment ? (
                  <Text className="text-sm text-muted-foreground italic">"{r.comment}"</Text>
                ) : null}
              </Card>
            ))
          ) : (
            <Card className="p-4">
              <Text className="text-sm text-muted-foreground">No reviews yet.</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 inset-x-0 px-5 pt-4 bg-white border-t border-border z-50"
        style={{ paddingBottom: footerPad, elevation: 8 }}
      >
        <PrimaryButton
          onClick={() => {
            setSelectedTasker(t);
            setBooking((prev) => ({
              ...prev,
              bookingType: "instant",
              preferredTasker: t,
              service: selectedService ?? prev.service,
            }));
            navigate("bookingForm");
          }}
        >
          {`Book Now · $${t.hourly}/h`}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

// --- BookingFormScreen ---
export function BookingFormScreen() {
  const { navigate, selectedService, selectedTasker, addresses, booking, setBooking } = useApp();
  const preferredTasker = selectedTasker;
  const defaultAddressObj = addresses.find((a) => a.default) ?? addresses[0];
  const defaultAddr = defaultAddressObj?.fullAddress || defaultAddressObj?.line;
  
  const initialSlot = getDefaultScheduledSlot(
    booking.scheduledDateIso,
    booking.time,
  );
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
    booking.bookingType === "instant" ? "instant" : "scheduled",
  );
  const [dateIso, setDateIso] = useState(
    booking.scheduledDateIso || initialSlot.dateIso,
  );
  const [hour, setHour] = useState(initialSlot.hour);
  const [minute, setMinute] = useState(initialSlot.minute);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [address, setAddress] = useState(booking.address || defaultAddr);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(
    booking.selectedAddressId ?? defaultAddressObj?.id,
  );
  const [notes, setNotes] = useState(booking.notes || "");
  const [imgs, setImgs] = useState<string[]>([]);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const pickPhoto = useCallback(async () => {
    if (pickingPhoto) return;

    try {
      setPickingPhoto(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Photo access required",
          "Please allow access to your photo library in Settings to attach images to your booking.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets[0]?.uri;
      if (uri) {
        setImgs((prev) => [...prev, uri]);
      }
    } catch {
      Alert.alert("Could not open photos", "Something went wrong while opening your photo library. Please try again.");
    } finally {
      setPickingPhoto(false);
    }
  }, [pickingPhoto]);

  const scheduledSlotError =
    scheduleMode === "scheduled"
      ? validateScheduledSlot(dateIso, hour, minute)
      : null;

  const valid =
    Boolean(address && selectedService) &&
    (scheduleMode === "instant" || !scheduledSlotError);

  const cont = () => {
    const isInstant = scheduleMode === "instant";
    let finalDateIso = dateIso;
    let finalTime = formatTimeSlot(hour, minute);

    if (isInstant) {
      const slot = roundToNextQuarterHour(new Date());
      finalDateIso = slot.dateIso;
      finalTime = formatTimeSlot(slot.hour, slot.minute);
      setScheduleError(null);
    } else {
      const err = validateScheduledSlot(dateIso, hour, minute);
      if (err) {
        setScheduleError(err);
        return;
      }
      setScheduleError(null);
    }

    setBooking({
      ...booking,
      service: selectedService,
      preferredTasker,
      bookingType: isInstant ? "instant" : "scheduled",
      selectedAddressId,
      scheduledDateIso: finalDateIso,
      date: formatDisplayDate(finalDateIso),
      time: finalTime,
      address,
      notes,
      total: computeOrderPricing(
        selectedService?.price ?? 0,
        isInstant ? "instant" : "scheduled",
      ).total,
    });
    navigate("bookingConfirm");
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Book Service" />
      <ScrollView className="px-5 pt-4" showsVerticalScrollIndicator={false}>
        <View className="space-y-4 pb-32">
          {selectedService ? (
            <Card className="p-3 flex-row items-center gap-3 bg-secondary/40 border-0">
              <View className="w-12 h-12 rounded-xl bg-emerald-100 items-center justify-center">
                <selectedService.icon size={22} color="#065f46" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-muted-foreground uppercase">Service</Text>
                <Text className="font-bold text-sm">{selectedService.name}</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">
                  ${selectedService.price} · {selectedService.duration}
                </Text>
              </View>
            </Card>
          ) : null}

          {preferredTasker ? (
            <Card className="p-3 flex-row items-center gap-3 bg-secondary/30">
              <Image source={{ uri: preferredTasker.avatar }} className="w-12 h-12 rounded-2xl" />
              <View className="flex-1">
                <Text className="text-[10px] text-muted-foreground uppercase">Preferred tasker</Text>
                <Text className="font-bold text-sm">{preferredTasker.name}</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">
                  We will match a nearby pro — preference is not guaranteed.
                </Text>
              </View>
            </Card>
          ) : (
            <Card className="p-3 bg-secondary/20">
              <Text className="text-sm text-muted-foreground">
                A nearby tasker will be assigned after you confirm. No tasker selection required.
              </Text>
            </Card>
          )}

          <Field label="Service Address">
            <View className="relative">
              <View className="absolute left-4 top-4 z-10"><MapPin size={18} color="#9ca3af" /></View>
              <Input 
                value={address} 
                onChangeText={(value) => {
                  setAddress(value);
                  const matched = addresses.find(
                    (a) => value === a.fullAddress || value === a.line,
                  );
                  setSelectedAddressId(matched?.id);
                }} 
                className="pl-12" 
                placeholder="Where do you need help?"
              />
            </View>
          </Field>

          <BookingSchedulePicker
            mode={scheduleMode}
            onModeChange={(m) => {
              setScheduleMode(m);
              setScheduleError(null);
            }}
            dateIso={dateIso}
            hour={hour}
            minute={minute}
            onDateIsoChange={setDateIso}
            onHourChange={setHour}
            onMinuteChange={setMinute}
            validationError={scheduleError ?? scheduledSlotError}
          />

          <Field label="Notes (optional)">
            <TextInput 
              value={notes} 
              onChangeText={setNotes} 
              multiline 
              placeholder="Anything we should know? (e.g. gate code, specific tools needed)"
              className="w-full min-h-[100px] p-4 rounded-2xl bg-muted text-sm text-foreground align-top"
            />
          </Field>

          <View>
            <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Upload photo (optional)</Text>
            <View className="flex-row flex-wrap gap-2">
              {imgs.map((src) => (
                <Image
                  key={src}
                  source={{ uri: src }}
                  className="w-20 h-20 rounded-2xl bg-muted"
                  resizeMode="cover"
                />
              ))}
              <TouchableOpacity
                onPress={pickPhoto}
                disabled={pickingPhoto}
                activeOpacity={0.7}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-border items-center justify-center bg-muted/30"
              >
                {pickingPhoto ? (
                  <ActivityIndicator size="small" color="#2E7D5B" />
                ) : (
                  <ImagePlus size={24} color="#9ca3af" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 inset-x-0 p-5 bg-white border-t border-border">
        <PrimaryButton onClick={cont} disabled={!valid}>Continue</PrimaryButton>
      </View>
    </Screen>
  );
}

// --- BookingConfirmScreen ---
export function BookingConfirmScreen() {
  const {
    navigate,
    booking,
    addresses,
    setBooking,
    createAndPublishOrder,
    isAuthenticated,
    authUser,
    catalogLoading,
    reloadCatalog,
  } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === booking.selectedAddressId);
  const selectedAddressText = selectedAddress?.fullAddress || selectedAddress?.line;
  const selectedAddressLocation =
    selectedAddress?.latitude != null && selectedAddress?.longitude != null
      ? { lat: selectedAddress.latitude, lng: selectedAddress.longitude }
      : null;

  const pricing = computeOrderPricing(
    booking.service?.price ?? 0,
    booking.bookingType === "instant" ? "instant" : "scheduled",
  );

  const submit = async () => {
    if (!booking.service || !booking.address) return;
    if (booking.bookingType !== "instant" && !booking.time) return;
    if (catalogLoading) {
      setError("Service catalog is still loading. Please try again in a moment.");
      return;
    }
    if (!selectedAddress || !selectedAddressText) {
      setError("Please select a saved address before requesting a tasker.");
      return;
    }
    if (!selectedAddressLocation) {
      setError("Selected address is missing coordinates. Please update it in Settings > Address.");
      return;
    }

    const selectedService = booking.service as Partial<CatalogService>;
    const serviceId = (selectedService.id ?? "").trim();
    const serviceType = (selectedService.apiIconKey ?? "").trim();
    const isFallbackServiceId = serviceId.startsWith("fallback-svc-");
    if (!serviceId || isFallbackServiceId) {
      await reloadCatalog();
      setError("Service data is outdated. Please reselect a service before requesting a tasker.");
      return;
    }

    const isInstant = booking.bookingType === "instant";
    const durationMinutes = resolveServiceDurationMinutes(selectedService);
    const window = buildBookingWindow({
      bookingType: isInstant ? "instant" : "scheduled",
      scheduledDateIso: booking.scheduledDateIso,
      time: booking.time,
      durationMinutes,
    });

    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated) {
        navigate("login");
        return;
      }
      if (authUser?.accountStatus === "blocked") {
        setError("Your account has been blocked. Contact support for help.");
        return;
      }

      await createAndPublishOrder({
        serviceName: selectedService.name ?? booking.service.name,
        serviceId,
        serviceType: serviceType || undefined,
        address: selectedAddressText,
        bookingType: isInstant ? "instant" : "scheduled",
        scheduledAt: isInstant ? undefined : window.startIso,
        notes: booking.notes || "",
        location: selectedAddressLocation,
      });
      navigate("orderMatching");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Confirm Booking" />
      <ScrollView className="px-5 pt-4">
        <Card className="p-4 gap-y-4">
          <Row
            icon={Calendar}
            label="Date"
            value={
              booking.bookingType === "instant"
                ? "Today (as soon as possible)"
                : booking.date || "—"
            }
          />
          <Row
            icon={Clock}
            label="Time"
            value={
              booking.bookingType === "instant"
                ? "Next available slot"
                : booking.time || "—"
            }
          />
          <View className="gap-y-2">
            <Row icon={MapPin} label="Address" value={selectedAddressText || "—"} />
            <TouchableOpacity
              onPress={() => setAddressDropdownOpen((prev) => !prev)}
              className="ml-12 h-9 px-3 rounded-xl border border-border bg-muted/30 items-center justify-center"
            >
              <Text className="text-xs font-bold text-primary">
                {addressDropdownOpen ? "Hide saved addresses" : "Choose saved address"}
              </Text>
            </TouchableOpacity>
            {addressDropdownOpen ? (
              <View className="ml-12 gap-y-2">
                {addresses.length === 0 ? (
                  <Text className="text-xs text-red-600">
                    No saved addresses found. Add one in Settings &gt; Address.
                  </Text>
                ) : (
                  addresses.map((addr) => {
                    const line = addr.fullAddress || addr.line || "Unnamed address";
                    const active = addr.id === booking.selectedAddressId;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        onPress={() => {
                          setBooking((prev) => ({
                            ...prev,
                            selectedAddressId: addr.id,
                            address: line,
                          }));
                          setError(null);
                          setAddressDropdownOpen(false);
                        }}
                        className={`p-3 rounded-xl border ${active ? "border-primary bg-secondary/30" : "border-border bg-white"}`}
                      >
                        <Text className="text-xs font-bold text-foreground">{addr.label}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">{line}</Text>
                        {addr.latitude == null || addr.longitude == null ? (
                          <Text className="text-[11px] text-red-600 mt-1">
                            Missing coordinates - update this address in Settings.
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
        </Card>

        <View className="mt-4 gap-y-3">
          {booking.preferredTasker ? (
            <Card className="p-3 flex-row items-center gap-3">
              <Image source={{ uri: booking.preferredTasker.avatar }} className="w-12 h-12 rounded-2xl" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Preferred tasker</Text>
                <Text className="font-bold">{booking.preferredTasker.name}</Text>
              </View>
            </Card>
          ) : null}

          <Card className="p-4">
            <PriceBreakdown pricing={pricing} />
          </Card>

          <Text className="text-center text-sm text-foreground font-semibold px-6 mt-2">
            We are finding a nearby tasker for your service.
          </Text>
          <Text className="text-center text-xs text-muted-foreground px-10">
            Payment is collected after a tasker accepts and service begins. Free cancellation up to 12 hours before the appointment.
          </Text>
          {error ? (
            <Text className="text-sm text-red-600 font-semibold text-center">{error}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 inset-x-0 p-5 bg-white border-t border-border gap-2">
        <PrimaryButton onClick={submit} disabled={loading} loading={loading}>
          Request Tasker
        </PrimaryButton>
        <TouchableOpacity onPress={() => navigate("bookingForm")} className="w-full h-12 items-center justify-center">
          <Text className="font-bold text-primary">Edit Details</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

// --- OrderMatchingScreen (waiting for tasker) ---
export function OrderMatchingScreen() {
  const { orders, activeOrderId, navigate, refreshOrder } = useApp();
  const order = orders.find((o) => o.id === activeOrderId) ?? orders[0];
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order?.id) return;

    if (order.apiStatus && order.apiStatus !== "pending") {
      if (needsPayment(order.apiStatus, order.paymentStatus)) {
        navigate("payment");
      } else if (canTrack(order.apiStatus)) {
        navigate("tracking");
      }
      return;
    }

    const poll = setInterval(() => {
      refreshOrder(order.id).then((fresh) => {
        if (!fresh) return;
        if (fresh.apiStatus && fresh.apiStatus !== "pending") {
          if (needsPayment(fresh.apiStatus, fresh.paymentStatus)) {
            navigate("payment");
          } else if (canTrack(fresh.apiStatus)) {
            navigate("tracking");
          }
        }
      }).catch(() => undefined);
    }, 12000);

    return () => clearInterval(poll);
  }, [order?.id, order?.apiStatus, navigate, refreshOrder]);

  if (!order) {
    return (
      <Screen className="bg-background items-center justify-center px-8">
        <Text className="text-muted-foreground">No active order.</Text>
        <PrimaryButton onClick={() => navigate("home")} className="mt-4">Back to Home</PrimaryButton>
      </Screen>
    );
  }

  return (
    <Screen className="bg-background">
      <TopBar title="Finding a Tasker" />
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 items-center justify-center">
          <View className="absolute w-24 h-24 rounded-full bg-primary/10" />
          <View className="absolute w-16 h-16 rounded-full bg-primary/20" />
          <ActivityIndicator size="large" color="#2E7D5B" />
        </View>
        <View className="mt-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100">
          <Text className="text-[10px] font-black uppercase text-violet-800 tracking-wider">
            Live matching
          </Text>
        </View>
        <Text className="text-2xl font-black mt-6 text-center">Matching you with a nearby pro</Text>
        <Text className="text-muted-foreground mt-3 text-center leading-5">
          We are finding a nearby tasker for your service. You will be notified when someone accepts.
        </Text>
        <Card className="p-4 mt-8 w-full">
          <Text className="text-xs text-muted-foreground uppercase font-bold">Order</Text>
          <Text className="font-bold text-lg mt-1">{order.service.name}</Text>
          <Text className="text-sm text-muted-foreground mt-2">{order.address}</Text>
          <Text className="text-[10px] text-muted-foreground mt-3">{order.id}</Text>
        </Card>
        {order.tasker ? (
          <Card className="p-3 flex-row items-center gap-3 mt-4 w-full">
            <Image source={{ uri: order.tasker.avatar }} className="w-12 h-12 rounded-2xl" />
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Tasker assigned</Text>
              <Text className="font-bold">{order.tasker.name}</Text>
            </View>
          </Card>
        ) : null}
        {error ? <Text className="text-red-600 mt-4 text-center">{error}</Text> : null}
        <TouchableOpacity onPress={() => navigate("orders")} className="mt-8">
          <Text className="font-bold text-primary">View My Orders</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

// --- PaymentScreen ---
export function PaymentScreen() {
  const { navigate, orders, activeOrderId, refreshOrder } = useApp();
  const [pay, setPay] = useState("card");
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = orders.find((o) => o.id === activeOrderId) ?? orders[0];

  const payments = [
    { id: "card", label: "Credit / Debit Card", sub: "Visa •••• 4242", icon: CreditCard },
    { id: "wallet", label: "E-Wallet", sub: "TaskGo Pay · $128.50", icon: Smartphone },
    { id: "bank", label: "Bank Transfer", sub: "Manual transfer", icon: Banknote },
    { id: "cash", label: "Cash", sub: "Pay after service", icon: Wallet },
  ];

  const orderPricing =
    order?.pricing ??
    computeOrderPricing(
      order?.service.price ?? 0,
      order?.bookingType === "instant" ? "instant" : "scheduled",
    );
  const discount = applied ? 10 : 0;
  const total = orderPricing.total - discount;

  const submit = async () => {
    if (!order?.id) return;

    setLoading(true);
    setError(null);
    try {
      await payOrderRequest(order.id, {}, createIdempotencyKey());
      await refreshOrder(order.id);
      navigate("paymentSuccess");
    } catch (err) {
      if (isPaymentFailedError(err)) {
        const msg = err.message || "Payment failed. Please try again.";
        setError(msg);
        showAppToast(msg, "error");
        await refreshOrder(order.id).catch(() => undefined);
      } else {
        const msg = authErrorMessage(err);
        setError(msg);
        showAppToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <Screen className="bg-background items-center justify-center px-8">
        <Text className="text-muted-foreground">No order ready for payment.</Text>
        <PrimaryButton onClick={() => navigate("orders")} className="mt-4">View Orders</PrimaryButton>
      </Screen>
    );
  }

  return (
    <Screen className="bg-background">
      <TopBar title="Payment" />
      <ScrollView className="px-5 pt-4">
        <Text className="font-bold text-lg mb-4">Choose payment method</Text>
        <View className="gap-y-2">
          {payments.map((p) => {
            const active = pay === p.id;
            return (
              <TouchableOpacity 
                key={p.id} 
                onPress={() => setPay(p.id)}
                className={`flex-row items-center p-4 rounded-2xl border-2 ${active ? 'border-primary bg-blue-50' : 'border-gray-100 bg-white'}`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${active ? 'bg-primary' : 'bg-muted'}`}>
                  <p.icon size={20} color={active ? 'white' : '#6b7280'} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-sm">{p.label}</Text>
                  <Text className="text-xs text-muted-foreground">{p.sub}</Text>
                </View>
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${active ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                  {active && <Check size={12} color="white" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-6">
          <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase">Promo code</Text>
          <View className="flex-row gap-2">
            <View className="flex-1 relative">
              <View className="absolute left-4 top-3.5 z-10"><Tag size={18} color="#9ca3af" /></View>
              <Input 
                value={promo} 
                onChangeText={setPromo} 
                placeholder="WELCOME10" 
                className="pl-12 h-12"
              />
            </View>
            <TouchableOpacity 
              onPress={() => setApplied(!!promo)}
              className="px-6 rounded-2xl bg-secondary items-center justify-center"
            >
              <Text className="font-bold text-primary">Apply</Text>
            </TouchableOpacity>
          </View>
          {applied && (
            <View className="flex-row items-center gap-1 mt-2">
              <Check size={14} color="#10b981" />
              <Text className="text-xs text-emerald-600 font-bold">Promo applied — $10 off</Text>
            </View>
          )}
        </View>

        <Card className="p-4 mt-6">
          <PriceBreakdown pricing={orderPricing} />
          {applied ? (
            <>
              <View className="h-px bg-border my-3" />
              <PriceRow label="Discount" value={`-$${discount}`} />
              <View className="h-px bg-border my-1" />
              <PriceRow label="Total" value={`$${total}`} bold />
            </>
          ) : null}
        </Card>
        {error ? (
          <Text className="text-sm text-red-600 font-semibold text-center mt-4 mb-32">{error}</Text>
        ) : (
          <View className="mb-32" />
        )}
      </ScrollView>

      <View className="absolute bottom-0 inset-x-0 p-5 bg-white border-t border-border">
        <PrimaryButton onClick={submit} disabled={loading} loading={loading}>
          Pay ${total}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

// --- PaymentSuccessScreen ---
export function PaymentSuccessScreen() {
  const { navigate, orders, activeOrderId, setActiveOrderId, refreshOrder } = useApp();
  const [phase, setPhase] = useState<"loading" | "done">("loading");

  const order = orders.find((o) => o.id === activeOrderId) ?? orders[0];

  useEffect(() => {
    if (order?.id) refreshOrder(order.id).catch(() => undefined);
    const t = setTimeout(() => setPhase("done"), 1400);
    return () => clearTimeout(t);
  }, [order?.id, refreshOrder]);

  return (
    <Screen className="bg-background items-center justify-center px-8">
      {phase === "loading" ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-xl font-black mt-6">Processing payment…</Text>
          <Text className="text-muted-foreground mt-1">Please wait a moment</Text>
        </View>
      ) : (
        <View className="w-full items-center">
          <View className="w-24 h-24 rounded-full bg-emerald-100 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-emerald-500 items-center justify-center shadow-lg">
              <Check size={32} color="white" strokeWidth={3} />
            </View>
          </View>
          <Text className="text-3xl font-black mt-8 text-center">Payment Successful!</Text>
          <Text className="text-muted-foreground mt-2 text-center">Thank you — your order is complete</Text>
          
          <Card className="p-5 mt-10 w-full">
            <View className="gap-y-3">
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground text-sm">Order ID</Text>
                <Text className="font-bold text-sm">{order?.id}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground text-sm">Service</Text>
                <Text className="font-bold text-sm text-right">{order?.service.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground text-sm">Total</Text>
                <Text className="font-black text-primary text-base">${order?.total}</Text>
              </View>
            </View>
          </Card>

          <View className="w-full mt-10 gap-y-3">
            <PrimaryButton onClick={() => { if (order?.id) setActiveOrderId(order.id); navigate("completed"); }}>
              View Order
            </PrimaryButton>
            <TouchableOpacity onPress={() => navigate("receipt")} className="w-full h-12 items-center justify-center">
              <Text className="font-bold text-primary">View Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigate("home")} className="w-full h-12 items-center justify-center">
              <Text className="font-bold text-muted-foreground">Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Screen>
  );
}

// --- ReceiptScreen ---
export function ReceiptScreen() {
  const { navigate, orders, activeOrderId } = useApp();
  const o = orders.find((x) => x.id === activeOrderId) || orders[0];

  if (!o) return null;

  return (
    <Screen className="bg-background">
      <TopBar title="Receipt" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card className="p-8 items-center bg-white">
          <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
            <Check size={32} color="#3b82f6" strokeWidth={3} />
          </View>
          <Text className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Payment Success</Text>
          <Text className="text-4xl font-black mt-2 mb-8">${o.total}</Text>
          
          <View className="w-full gap-y-4">
            <ReceiptRow label="Order ID" value={o.id} />
            <ReceiptRow label="Date" value={o.date} />
            <ReceiptRow label="Payment" value={o.payment} />
            <View className="h-px bg-gray-100 my-2" />
            <ReceiptRow label="Service" value={o.service.name} />
            {o.tasker ? <ReceiptRow label="Tasker" value={o.tasker.name} /> : null}
          </View>

          <View className="mt-10 flex-row gap-4 w-full">
            <TouchableOpacity className="flex-1 h-12 rounded-xl bg-muted items-center justify-center flex-row gap-2">
              <Download size={18} color="#6b7280" />
              <Text className="font-bold text-gray-600">PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 h-12 rounded-xl bg-muted items-center justify-center flex-row gap-2">
              <Share2 size={18} color="#6b7280" />
              <Text className="font-bold text-gray-600">Share</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        <PrimaryButton onClick={() => navigate("home")} className="mt-8">Back to Home</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="font-bold text-sm">{value}</Text>
    </View>
  );
}

// --- Helper Components ---

function StatCard({ label, val, icon: Icon }: any) {
  return (
    <View className="flex-1 rounded-2xl bg-muted p-3 items-center">
      <Text className="text-lg font-black">{val}</Text>
      <View className="flex-row items-center gap-1 mt-0.5">
        <Icon size={10} color="#6b7280" />
        <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{label}</Text>
      </View>
    </View>
  );
}

function Row({ icon: Icon, label, value }: any) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
        <Icon size={18} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-muted-foreground uppercase font-bold">{label}</Text>
        <Text className="font-bold text-sm" numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function PriceRow({ label, value, bold }: any) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={`${bold ? 'font-black text-base' : 'text-sm text-muted-foreground'}`}>{label}</Text>
      <Text className={`${bold ? 'font-black text-lg text-primary' : 'font-bold text-sm'}`}>{value}</Text>
    </View>
  );
}
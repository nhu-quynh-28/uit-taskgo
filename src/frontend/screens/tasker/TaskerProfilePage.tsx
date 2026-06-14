import axios from "axios";
import { patchMeRequest } from "@/lib/api/users";
import { isApiError } from "@/lib/api/errors";
import { DEFAULT_AVATAR } from "@/lib/auth/mapUser";
import type { CatalogService } from "@/lib/adapters/catalogAdapter";
import { showAppToast } from "@/components/ux/toast";
import { useApp } from "@/screens/AppContext";
import { serviceCategoryOptions } from "@/screens/taskerData";
import { Card, Field, Input, PrimaryButton, Screen } from "@/screens/ui";
import { pickAvatarFromGallery } from "@/lib/profile/pickAvatarImage";
import {
  Briefcase,
  Check,
  LogOut,
  Pencil,
  Sparkles,
  Star,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
};

function fallbackCatalogServices(): CatalogService[] {
  return serviceCategoryOptions.map((name, index) => ({
    id: `fallback-svc-${index}`,
    name,
    icon: Sparkles,
    color: "bg-emerald-50",
    price: 0,
    duration: "—",
    description: "",
    includes: [],
    rating: 4.8,
    reviews: 0,
    apiCategory: name.toLowerCase(),
    apiIconKey: name.toLowerCase(),
  }));
}

function ReadOnlyNameField({ value }: { value: string }) {
  return (
    <View>
      <Field label="Full Name">
        <Input
          value={value}
          editable={false}
          selectTextOnFocus={false}
          className="opacity-90 bg-muted"
        />
      </Field>
      <Text className="text-[11px] text-muted-foreground -mt-2 mb-1 italic leading-4">
        Your name is synced with your approved KYC documents and cannot be changed.
      </Text>
    </View>
  );
}

type ServiceSelectGridProps = {
  services: CatalogService[];
  selectedServiceIds: string[];
  onToggle: (serviceId: string) => void;
  loading?: boolean;
};

function ServiceSelectGrid({
  services,
  selectedServiceIds,
  onToggle,
  loading,
}: ServiceSelectGridProps) {
  if (loading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator color="#2E7D5B" />
        <Text className="text-xs text-muted-foreground mt-2">Loading services…</Text>
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <Text className="text-sm text-muted-foreground py-4">
        No services available. Please try again later.
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {services.map((svc) => {
        const selected = selectedServiceIds.includes(svc.id);
        return (
          <TouchableOpacity
            key={svc.id}
            activeOpacity={0.85}
            onPress={() => onToggle(svc.id)}
            className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 max-w-full ${
              selected
                ? "bg-primary border-primary"
                : "bg-muted/30 border-border"
            }`}
          >
            {selected ? <Check size={14} color="#F7FBF9" /> : null}
            <Text
              className={`text-sm font-bold ${selected ? "text-primary-foreground" : "text-foreground"}`}
              numberOfLines={2}
            >
              {svc.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function TaskerProfilePageScreen() {
  const {
    user,
    documents,
    taskerProfile,
    setTaskerProfile,
    setUser,
    setDocuments,
    syncProfileFromDto,
    catalogServices,
    catalogLoading,
    reloadCatalog,
    logout,
  } = useApp();

  const lockedName =
    documents.kyc?.fullName?.trim() ||
    taskerProfile.name ||
    user.name ||
    "";

  const [form, setForm] = useState<ProfileForm>({
    name: lockedName,
    email: user.email,
    phone: user.phone || taskerProfile.phone || documents.kyc?.phone || "",
    dob: documents.kyc?.dob ?? taskerProfile.dob ?? "",
    address: documents.kyc?.address ?? taskerProfile.address ?? "",
  });

  const [selectedServices, setSelectedServices] = useState<string[]>(
    taskerProfile.selectedServiceIds ?? [],
  );
  const [aboutText, setAboutText] = useState(taskerProfile.bio ?? "");
  const [persistAvatar, setPersistAvatar] = useState(user.avatar);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayAvatar = avatarBroken ? DEFAULT_AVATAR : user.avatar || DEFAULT_AVATAR;

  const availableServices = useMemo(
    () => (catalogServices.length > 0 ? catalogServices : fallbackCatalogServices()),
    [catalogServices],
  );

  useEffect(() => {
    void reloadCatalog();
  }, [reloadCatalog]);

  useEffect(() => {
    setForm({
      name: lockedName,
      email: user.email,
      phone: user.phone || documents.kyc?.phone || taskerProfile.phone || "",
      dob: documents.kyc?.dob ?? taskerProfile.dob ?? "",
      address: documents.kyc?.address ?? taskerProfile.address ?? "",
    });
    setSelectedServices(taskerProfile.selectedServiceIds ?? []);
    setAboutText(taskerProfile.bio ?? "");
  }, [
    lockedName,
    user.email,
    user.phone,
    documents.kyc,
    taskerProfile.dob,
    taskerProfile.address,
    taskerProfile.phone,
    taskerProfile.selectedServiceIds,
    taskerProfile.bio,
  ]);

  const valid =
    form.phone.trim().length >= 6 &&
    form.dob.trim().length >= 8 &&
    form.address.trim().length >= 5;

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const onPickAvatar = async () => {
    if (pickingAvatar || saving) return;
    setPickingAvatar(true);
    try {
      const picked = await pickAvatarFromGallery();
      if (!picked) return;
      setAvatarBroken(false);
      setPersistAvatar(picked.persistUri);
      setUser({ ...user, avatar: picked.previewUri });
    } catch {
      showAppToast("Could not open your photo library. Please try again.", "error");
    } finally {
      setPickingAvatar(false);
    }
  };

  const save = async () => {
    if (!valid || saving) return;

    setSaving(true);
    const payload = {
      phone: form.phone.trim(),
      dob: form.dob.trim(),
      address: form.address.trim(),
      services: selectedServices,
      bio: aboutText.trim(),
      avatar: persistAvatar || null,
    };

    try {
      const updated = await patchMeRequest(payload);
      syncProfileFromDto(updated);

      setUser({
        ...user,
        phone: updated.phone ?? form.phone.trim(),
        avatar: updated.avatar ?? user.avatar,
      });

      setTaskerProfile({
        ...taskerProfile,
        name: lockedName,
        avatar: updated.avatar ?? taskerProfile.avatar,
        phone: updated.phone ?? form.phone.trim(),
        dob: updated.kyc?.dob ?? form.dob.trim(),
        address: updated.kyc?.address ?? form.address.trim(),
        selectedServiceIds: updated.services ?? selectedServices,
        bio: updated.bio ?? aboutText.trim(),
      });

      if (documents.kyc) {
        setDocuments({
          ...documents,
          kyc: {
            ...documents.kyc,
            phone: updated.kyc?.phone ?? form.phone.trim(),
            dob: updated.kyc?.dob ?? form.dob.trim(),
            address: updated.kyc?.address ?? form.address.trim(),
          },
        });
      }

      showAppToast("Profile updated successfully!", "success");
    } catch (err) {
      console.log(">>> [UPDATE PROFILE ERROR]", axios.isAxiosError(err) ? err.response?.data : err);
      showAppToast("Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogOut = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            if (loggingOut) return;
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <Screen className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="bg-primary rounded-b-[40px] px-5 pt-12 pb-14 items-center relative">
          <Text className="text-primary-foreground font-bold text-lg mb-6">Profile</Text>
          <TouchableOpacity
            onPress={() => void onPickAvatar()}
            disabled={pickingAvatar || saving}
            activeOpacity={0.85}
            className="relative"
          >
            <Image
              source={{ uri: displayAvatar }}
              onError={() => setAvatarBroken(true)}
              className="w-24 h-24 rounded-[30px] border-4 border-white/20 shadow-lg bg-white/10"
            />
            {pickingAvatar ? (
              <View className="absolute inset-0 rounded-[30px] bg-black/35 items-center justify-center">
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
            <View className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white items-center justify-center border-2 border-primary">
              <Pencil size={14} color="#2E7D5B" />
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-black text-primary-foreground mt-4">{lockedName}</Text>
          <Text className="text-sm text-primary-foreground/70">{taskerProfile.category}</Text>

          <View className="flex-row items-center gap-4 mt-4">
            <View className="flex-row items-center gap-1 bg-white/15 px-3 py-1.5 rounded-full">
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <Text className="text-xs font-black text-primary-foreground">
                {taskerProfile.rating.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-white/15 px-3 py-1.5 rounded-full">
              <Briefcase size={14} color="#F7FBF9" />
              <Text className="text-xs font-black text-primary-foreground">
                {taskerProfile.totalJobs} jobs
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 -mt-6 pb-28 gap-y-4">
          <Card className="p-5 border-border">
            <Text className="font-black text-base text-foreground mb-1">Personal Information</Text>
            <Text className="text-xs text-muted-foreground mb-5 leading-4">
              Update your contact details and address. Your full name comes from approved KYC.
            </Text>

            <View className="gap-y-1">
              <ReadOnlyNameField value={form.name} />
              <Field label="Email">
                <Input
                  value={form.email}
                  editable={false}
                  selectTextOnFocus={false}
                  className="opacity-90 bg-muted"
                />
              </Field>
              <Field label="Phone Number">
                <Input
                  value={form.phone}
                  onChangeText={(v: string) => setForm({ ...form, phone: v })}
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="Date of Birth">
                <Input
                  value={form.dob}
                  onChangeText={(v: string) => setForm({ ...form, dob: v })}
                  placeholder="25/05/1992"
                />
              </Field>
              <Field label="Permanent Address">
                <Input
                  value={form.address}
                  onChangeText={(v: string) => setForm({ ...form, address: v })}
                  placeholder="House number, street, ward, district, city"
                  multiline
                  className="h-auto min-h-[56px] py-3"
                  style={{ textAlignVertical: "top" }}
                />
              </Field>
            </View>
          </Card>

          <Card className="p-5 border-border">
            <Text className="font-black text-base text-foreground mb-1">About Me</Text>
            <Text className="text-xs text-muted-foreground mb-4 leading-4">
              Introduce yourself to customers before they book you.
            </Text>
            <Field label="Biography">
              <Input
                value={aboutText}
                onChangeText={setAboutText}
                placeholder="Tell customers about your experience, skills, and working attitude..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="h-auto min-h-[120px] py-3"
                style={{ minHeight: 120 }}
              />
            </Field>
          </Card>

          <Card className="p-5 border-border">
            <Text className="font-black text-base text-foreground">Services Offered</Text>
            <Text className="text-xs text-muted-foreground mt-1 mb-4 leading-4">
              Select the job types you want to receive notifications for. Matching bookings will
              only alert taskers who registered for that service (coming soon).
            </Text>
            <ServiceSelectGrid
              services={availableServices}
              selectedServiceIds={selectedServices}
              onToggle={toggleService}
              loading={catalogLoading}
            />
            {selectedServices.length > 0 ? (
              <Text className="text-[11px] text-muted-foreground mt-4">
                {selectedServices.length} service{selectedServices.length === 1 ? "" : "s"} selected
              </Text>
            ) : (
              <Text className="text-[11px] text-amber-700 mt-4 font-medium">
                No services selected — you will not receive category-based job alerts.
              </Text>
            )}
          </Card>

          <TouchableOpacity
            onPress={handleLogOut}
            disabled={loggingOut || saving}
            activeOpacity={0.75}
            className="flex-row items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-rose-200 bg-rose-50"
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#e11d48" />
            ) : (
              <LogOut size={17} color="#e11d48" />
            )}
            <Text className="text-rose-600 font-bold text-sm">
              {loggingOut ? "Logging out…" : "Log Out"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="p-5 border-t border-border bg-white">
        <PrimaryButton onClick={save} disabled={!valid || saving} loading={saving}>
          Save Changes
        </PrimaryButton>
      </View>
    </Screen>
  );
}

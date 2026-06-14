import { patchMeRequest } from "@/lib/api/users";
import { authErrorMessage } from "@/lib/auth/messages";
import { showAppToast } from "@/components/ux/toast";
import { useApp, type Address } from "@/screens/AppContext";
import { Card, Field, Input, PrimaryButton, Screen, TopBar } from "@/screens/ui";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  Moon,
  Navigation,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  Shield,
  Star,
  Trash2,
  User2
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Switch,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  addressToFormFields,
  ensureOneDefault,
  formFieldsToAddress,
} from "@/lib/profile/addresses";
import { getCurrentLocationWithAddress } from "@/lib/location/currentLocation";
import { DEFAULT_AVATAR } from "@/lib/auth/mapUser";
import { pickAvatarFromGallery } from "@/lib/profile/pickAvatarImage";
import Svg, { Path } from "react-native-svg";

// --- ProfileScreen ---
export function ProfileScreen() {
  const { user, navigate, logout } = useApp();
  const [avatarUri, setAvatarUri] = useState(user.avatar || DEFAULT_AVATAR);

  useEffect(() => {
    setAvatarUri(user.avatar || DEFAULT_AVATAR);
  }, [user.avatar]);

  const items = [
    { id: "editProfile", icon: User2, label: "Personal Information" },
    { id: "addresses", icon: MapPin, label: "Addresses" },
    { id: "paymentMethods", icon: CreditCard, label: "Payment Methods" },
    { id: "orders", icon: ClipboardList, label: "Order History" },
    { id: "reviews", icon: Star, label: "My Reviews" },
    { id: "help", icon: HelpCircle, label: "Help Center" },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
  ] as const;

  return (
    <Screen className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary rounded-b-[40px] px-5 pt-12 pb-14 items-center relative">
          <Text className="text-primary-foreground font-bold text-lg mb-6">Profile</Text>
          <Image
            source={{ uri: avatarUri }}
            onError={() => setAvatarUri(DEFAULT_AVATAR)}
            className="w-24 h-24 rounded-[30px] border-4 border-white/20 shadow-lg bg-white/10"
          />
          <Text className="text-xl font-black text-primary-foreground mt-4">{user.name}</Text>
          <Text className="text-sm text-primary-foreground/70">{user.email}</Text>
          
          <View className="flex-row items-center gap-1 mt-3 px-4 py-1.5 rounded-full bg-white shadow-sm">
            <Crown size={14} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-[10px] font-black text-amber-600 uppercase">Gold Member</Text>
          </View>
        </View>

        <View className="px-5 -mt-8 gap-y-3 pb-10">
          <Card className="overflow-hidden p-0 border-border">
            {items.map((it, i) => (
              <TouchableOpacity 
                key={it.id} 
                onPress={() => navigate(it.id)}
                activeOpacity={0.7}
                className={`flex-row items-center gap-4 p-4 ${i !== items.length - 1 ? "border-b border-muted" : ""}`}
              >
                <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                  <it.icon size={20} color="#2E7D5B" />
                </View>
                <Text className="flex-1 font-bold text-sm text-foreground">{it.label}</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </Card>

          <TouchableOpacity 
            onPress={() => logout()}
            className="w-full h-14 rounded-2xl bg-red-50 flex-row items-center justify-center gap-2 mt-4"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- EditProfileScreen ---
export function EditProfileScreen() {
  const { user, navigate, syncProfileFromDto } = useApp();
  const [f, setF] = useState(user);
  const [persistAvatar, setPersistAvatar] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const displayAvatar = avatarBroken ? DEFAULT_AVATAR : f.avatar || DEFAULT_AVATAR;

  const valid = f.name && f.email.includes("@") && f.phone.length >= 6;

  const onPickAvatar = async () => {
    if (pickingAvatar || saving) return;
    setPickingAvatar(true);
    try {
      const picked = await pickAvatarFromGallery();
      if (!picked) return;
      setAvatarBroken(false);
      setF((prev) => ({ ...prev, avatar: picked.previewUri }));
      setPersistAvatar(picked.persistUri);
    } catch {
      showAppToast("Could not open your photo library. Please try again.", "error");
    } finally {
      setPickingAvatar(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await patchMeRequest({
        name: f.name.trim(),
        phone: f.phone.trim(),
        avatar: persistAvatar || null,
      });
      syncProfileFromDto(updated);
      navigate("profile");
    } catch (err) {
      showAppToast(authErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Personal Information" />
      <ScrollView className="px-5 pt-6">
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={() => void onPickAvatar()}
            disabled={pickingAvatar || saving}
            activeOpacity={0.85}
            className="relative"
          >
            <Image
              source={{ uri: displayAvatar }}
              onError={() => setAvatarBroken(true)}
              className="w-24 h-24 rounded-[30px] bg-muted"
            />
            {pickingAvatar ? (
              <View className="absolute inset-0 rounded-[30px] bg-black/35 items-center justify-center">
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
            <View className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary items-center justify-center border-4 border-white">
              <Pencil size={14} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-muted-foreground mt-3">Tap photo to change</Text>
        </View>

        <View className="gap-y-4">
          <Field label="Full name">
            <Input value={f.name} onChangeText={(v: string) => setF({ ...f, name: v })} />
          </Field>
          <Field label="Email" error={f.email && !f.email.includes("@") ? "Invalid email" : undefined}>
            <Input value={f.email} onChangeText={(v: string) => setF({ ...f, email: v })} keyboardType="email-address" />
          </Field>
          <Field label="Phone">
            <Input value={f.phone} onChangeText={(v: string) => setF({ ...f, phone: v })} keyboardType="phone-pad" />
          </Field>
        </View>
      </ScrollView>
      <View className="p-5 border-t border-border bg-white">
        <PrimaryButton onClick={save} disabled={!valid} loading={saving}>Save Changes</PrimaryButton>
      </View>
    </Screen>
  );
}

type AddressForm = {
  label: string;
  houseNumber: string;
  street: string;
  ward: string;
  district: string;
  city: string;
};

function emptyForm(): AddressForm {
  return { label: "", houseNumber: "", street: "", ward: "", district: "", city: "" };
}

// --- AddressesScreen ---
export function AddressesScreen() {
  const { addresses, saveAddresses } = useApp();
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm());
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const formValid =
    form.label.trim().length > 0 &&
    form.street.trim().length > 0 &&
    form.district.trim().length > 0 &&
    form.city.trim().length > 0;

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm(addressToFormFields(a));
    setCoords({ latitude: a.latitude, longitude: a.longitude });
  };

  const openNew = () => {
    const id = `addr-${Date.now()}`;
    openEdit({
      id,
      label: "New Address",
      fullAddress: "",
      line: "",
      default: addresses.length === 0,
      houseNumber: "",
      street: "",
      ward: "",
      district: "",
      city: "",
    });
    setForm({
      label: "Home",
      houseNumber: "",
      street: "",
      ward: "",
      district: "",
      city: "",
    });
    setCoords({});
  };

  const onUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const result = await getCurrentLocationWithAddress();
      setForm({
        label: form.label.trim() || "Home",
        houseNumber: result.houseNumber,
        street: result.street,
        ward: result.ward,
        district: result.district,
        city: result.city,
      });
      setCoords({ latitude: result.latitude, longitude: result.longitude });
      showAppToast("Current location applied", "success");
    } catch (err) {
      showAppToast(authErrorMessage(err), "error");
    } finally {
      setLocating(false);
    }
  };

  const persist = async (next: Address[]) => {
    setSaving(true);
    try {
      await saveAddresses(next);
    } catch (err) {
      showAppToast(authErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    await persist(ensureOneDefault(addresses, id));
  };

  const remove = async (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    await persist(ensureOneDefault(next));
  };

  const saveEdit = async () => {
    if (!editing || !formValid) return;
    const patch = formFieldsToAddress(editing, form, coords);
    const exists = addresses.some((a) => a.id === editing.id);
    const next = exists
      ? addresses.map((a) => (a.id === editing.id ? patch : a))
      : [...addresses, patch];
    await persist(ensureOneDefault(next, editing.default ? editing.id : undefined));
    setEditing(null);
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Addresses" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="rounded-3xl overflow-hidden h-32 bg-emerald-50 relative mb-6">
          <Svg height="100%" width="100%" viewBox="0 0 400 200">
            <Path d="M0 100 Q 100 60 200 100 T 400 100" stroke="#A8E6CF" strokeWidth="3" fill="none" />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg">
              <MapPin size={24} color="white" />
            </View>
          </View>
        </View>

        {addresses.map((a) => (
          <Card key={a.id} className="p-4 mb-4 border-border">
            <View className="flex-row items-start gap-3">
              <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                <MapPin size={20} color="#2E7D5B" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-base text-foreground">{a.label}</Text>
                  {a.default && (
                    <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-black text-emerald-700 uppercase">Default</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-muted-foreground mt-1">
                  {a.fullAddress || a.line}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2 mt-4">
              {!a.default && (
                <TouchableOpacity onPress={() => setDefault(a.id)} className="flex-1 h-9 rounded-xl bg-secondary items-center justify-center">
                  <Text className="text-primary font-bold text-xs">Set default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => openEdit(a)}
                className="flex-1 h-9 rounded-xl bg-gray-100 items-center justify-center flex-row gap-1"
              >
                <Pencil size={12} color="#6b7280" />
                <Text className="font-bold text-xs text-gray-600">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => remove(a.id)}
                className="flex-1 h-9 rounded-xl bg-red-50 items-center justify-center flex-row gap-1"
              >
                <Trash2 size={12} color="#ef4444" />
                <Text className="font-bold text-xs text-red-500">Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        <TouchableOpacity
          onPress={openNew}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-muted flex-row items-center justify-center gap-2"
        >
          <Plus size={18} color="#2E7D5B" />
          <Text className="text-primary font-bold">Add Address</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editing !== null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8 max-h-[85%]">
            <Text className="text-lg font-black text-foreground mb-4">
              {addresses.some((a) => a.id === editing?.id) ? "Edit address" : "New address"}
            </Text>
            <ScrollView className="max-h-96" keyboardShouldPersistTaps="handled">
              <View className="gap-y-3">
                <TouchableOpacity
                  onPress={() => void onUseCurrentLocation()}
                  disabled={locating || saving}
                  className="h-12 rounded-2xl bg-secondary flex-row items-center justify-center gap-2 mb-1"
                >
                  <Navigation size={16} color="#2E7D5B" />
                  <Text className="text-primary font-bold text-sm">
                    {locating ? "Getting location…" : "Use Current Location"}
                  </Text>
                </TouchableOpacity>
                <Field label="Label">
                  <Input
                    value={form.label}
                    onChangeText={(v: string) => setForm({ ...form, label: v })}
                    placeholder="Home, Work, etc."
                  />
                </Field>
                <Field label="House Number">
                  <Input
                    value={form.houseNumber}
                    onChangeText={(v: string) => setForm({ ...form, houseNumber: v })}
                    placeholder="12"
                  />
                </Field>
                <Field label="Street">
                  <Input
                    value={form.street}
                    onChangeText={(v: string) => setForm({ ...form, street: v })}
                    placeholder="Nguyen Trai Street"
                  />
                </Field>
                <Field label="Ward">
                  <Input
                    value={form.ward}
                    onChangeText={(v: string) => setForm({ ...form, ward: v })}
                    placeholder="Ward 5"
                  />
                </Field>
                <Field label="District">
                  <Input
                    value={form.district}
                    onChangeText={(v: string) => setForm({ ...form, district: v })}
                    placeholder="District 1"
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={form.city}
                    onChangeText={(v: string) => setForm({ ...form, city: v })}
                    placeholder="Ho Chi Minh City"
                  />
                </Field>
              </View>
            </ScrollView>
            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => setEditing(null)}
                disabled={saving}
                className="flex-1 h-12 rounded-2xl bg-muted items-center justify-center"
              >
                <Text className="font-bold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <View className="flex-1">
                <PrimaryButton onClick={saveEdit} disabled={!formValid} loading={saving}>
                  Save
                </PrimaryButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

// --- PaymentMethodsScreen ---
export function PaymentMethodsScreen() {
  const { navigate } = useApp();
  return (
    <Screen className="bg-background">
      <TopBar title="Payment Methods" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card className="p-4 mb-4 border-border">
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-8 bg-primary rounded items-center justify-center">
              <CreditCard size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-foreground">Visa •••• 4242</Text>
              <Text className="text-xs text-muted-foreground">Expires 12/26</Text>
            </View>
            <View className="bg-secondary px-2 py-1 rounded-full">
              <Text className="text-[10px] font-black text-primary uppercase">Default</Text>
            </View>
          </View>
        </Card>
        
        <TouchableOpacity 
          className="w-full h-14 rounded-2xl border-2 border-dashed border-muted flex-row items-center justify-center gap-2"
        >
          <Plus size={18} color="#2E7D5B" />
          <Text className="text-primary font-bold">Add New Method</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

// --- SettingsScreen ---
export function SettingsScreen() {
  const { notif, setNotif, darkMode, setDarkMode, language, setLanguage, logout } = useApp();

  return (
    <Screen className="bg-background">
      <TopBar title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card className="overflow-hidden p-0 mb-4">
          <ToggleRow icon={Bell} label="Notifications" value={notif} onValueChange={setNotif} />
          <ToggleRow icon={Moon} label="Dark Mode" value={darkMode} onValueChange={setDarkMode} />
        </Card>

        <Card className="overflow-hidden p-0 mb-4">
          <SelectRow icon={Globe} label="Language" value={language} onPress={() => setLanguage(language === "English" ? "Spanish" : "English")} />
          <RowLink icon={Lock} label="Privacy" />
          <RowLink icon={Shield} label="Security" />
        </Card>

        <TouchableOpacity 
          onPress={() => logout()}
          className="w-full h-14 rounded-2xl bg-red-50 flex-row items-center justify-center gap-2 mt-4"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-500 font-bold">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

// --- Helper Components ---

function ToggleRow({ icon: Icon, label, value, onValueChange }: any) {
  return (
    <View className="flex-row items-center gap-4 p-4 border-b border-muted">
      <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
        <Icon size={20} color="#2E7D5B" />
      </View>
      <Text className="flex-1 font-bold text-sm text-foreground">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e2e8f0", true: "#2E7D5B" }}
        thumbColor={"#ffffff"}
      />
    </View>
  );
}

function SelectRow({ icon: Icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center gap-4 p-4 border-b border-muted">
      <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
        <Icon size={20} color="#2E7D5B" />
      </View>
      <Text className="flex-1 font-bold text-sm text-foreground">{label}</Text>
      <Text className="text-xs text-muted-foreground mr-1">{value}</Text>
      <ChevronRight size={16} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function RowLink({ icon: Icon, label }: any) {
  return (
    <TouchableOpacity className="flex-row items-center gap-4 p-4 border-b border-muted">
      <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
        <Icon size={20} color="#2E7D5B" />
      </View>
      <Text className="flex-1 font-bold text-sm text-foreground">{label}</Text>
      <ChevronRight size={16} color="#94a3b8" />
    </TouchableOpacity>
  );
}

export function HelpScreen() {
  const faqs = [
    { q: "How do I book a service?", a: "Browse categories, pick a service, choose a tasker, and confirm your booking." },
    { q: "Can I cancel my booking?", a: "Yes, free cancellation up to 12 hours before the appointment." },
    { q: "How do payments work?", a: "Pay securely via card, e-wallet, bank transfer or cash on completion." },
  ];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen className="bg-background">
      <TopBar title="Help Center" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {faqs.map((f, i) => (
          <TouchableOpacity 
            key={i} 
            activeOpacity={0.8}
            onPress={() => setOpen(open === i ? null : i)}
            className="mb-3"
          >
            <Card className="p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-sm flex-1 pr-4 text-gray-800">{f.q}</Text>
                <ChevronRight 
                  size={16} 
                  color="#9ca3af" 
                  style={{ transform: [{ rotate: open === i ? '90deg' : '0deg' }] }} 
                />
              </View>
              {open === i && (
                <Text className="text-sm text-muted-foreground mt-3 leading-5">{f.a}</Text>
              )}
            </Card>
          </TouchableOpacity>
        ))}
        
        <View className="rounded-[32px] p-6 bg-primary mt-6 relative overflow-hidden">
          <HelpCircle size={80} color="rgba(255,255,255,0.1)" className="absolute -right-4 -bottom-4" />
          <Text className="text-primary-foreground font-black text-xl w-[70%]">How can we help you today?</Text>
          <TouchableOpacity className="mt-4 bg-white self-start px-6 py-2 rounded-full">
            <Text className="text-primary font-bold text-sm">Contact Us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
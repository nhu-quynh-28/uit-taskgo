import { useApp } from "@/screens/AppContext";
import { monthlyEarnings, serviceCategoryOptions } from "@/screens/taskerData";
import { Card, Field, Input, PrimaryButton, Screen, TopBar } from "@/screens/ui";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Edit3,
  FileText,
  MapPin,
  MessageCircle, Navigation as NavIcon,
  Phone,
  RotateCcw,
  Sparkles,
  Star,
  Timer,
  User2,
  Wallet,
  Zap
} from "lucide-react-native";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  apiStatusToTaskerJobStatus,
  emptyStateMessageForJobsTab,
  filterTaskerJobsForTab,
  getNextTaskerStatusAction,
  sortTaskerJobsBySchedule,
  taskerStatusBlockedMessage,
  type TaskerJob,
  type TaskerJobsTab,
} from "@/lib/adapters/taskerOrderAdapter";
import axios from "axios";
import { submitKycRequest } from "@/lib/api/users";
import { isApiError } from "@/lib/api/errors";
import { config } from "@/lib/config";
import type { PickedImage } from "@/lib/profile/pickImage";
import { pickIdImageWithSourceMenu } from "@/lib/profile/pickImage";
import { toBackendKycDataUri } from "@/lib/profile/kycImage";
import type { TaskerKycPayload } from "@/screens/AppContext";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

/* =========================== Tasker Registration =========================== */
export function TaskerRegisterScreen() {
  const { navigate, taskerProfile, setTaskerProfile } = useApp();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(taskerProfile.category);
  const [skills, setSkills] = useState<string[]>(taskerProfile.skills);
  const [exp, setExp] = useState(taskerProfile.experience);
  const [area, setArea] = useState(taskerProfile.area);
  const [radius, setRadius] = useState(10);

  const total = 4;
  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else {
      setTaskerProfile({ ...taskerProfile, category, skills, experience: exp, area: `${area} · ${radius} km` });
      navigate("tDocuments");
    }
  };
  const back = () => (step > 0 ? setStep(step - 1) : navigate("register"));
  const canNext = (step === 0 && category) || (step === 1 && skills.length > 0) || (step === 2 && exp) || (step === 3 && area.length > 2);

  return (
    <Screen className="bg-background">
      <TopBar title="Become a Tasker" onBack={back} />
      <View className="px-5 pb-4">
        <View className="flex-row gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-gray-200"}`} />
          ))}
        </View>
        <Text className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Step {step + 1} of {total}</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View>
            <Text className="text-2xl font-black">Pick your category</Text>
            <View className="flex-row flex-wrap justify-between mt-5">
              {serviceCategoryOptions.map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)}
                  className={`w-[48%] p-4 rounded-2xl border-2 mb-3 ${category === c ? "border-primary bg-secondary" : "border-gray-100 bg-white"}`}>
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${category === c ? "bg-primary" : "bg-gray-100"}`}>
                    <Sparkles size={18} color={category === c ? "white" : "#666"} />
                  </View>
                  <Text className="font-bold text-sm">{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text className="text-2xl font-black">Service area</Text>
            <View className="mt-5 space-y-6">
              <Field label="City"><Input value={area} onChangeText={setArea} placeholder="e.g. District 1, Ho Chi Minh City" /></Field>
              <View>
                <Text className="text-xs font-bold text-gray-500 mb-4 uppercase">Travel radius: <Text className="text-primary">{radius} km</Text></Text>
                <View className="items-center justify-center bg-emerald-50 rounded-3xl h-40 overflow-hidden">
                  <View 
                    style={{ width: radius * 8, height: radius * 8, borderRadius: 100 }} 
                    className="bg-primary/20 items-center justify-center"
                  >
                    <View className="w-8 h-8 rounded-full bg-primary items-center justify-center shadow-lg">
                      <MapPin size={16} color="white" />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* Các bước 1 & 2 tương tự với các nút TouchableOpacity */}
      </ScrollView>

      <View className="p-5 border-t border-border bg-white">
        <PrimaryButton onClick={next} disabled={!canNext}>{step === total - 1 ? "Continue" : "Next"}</PrimaryButton>
      </View>
    </Screen>
  );
}

/* =========================== Tasker Dashboard =========================== */
export function TaskerDashboardScreen() {
  const { online, setOnline, taskerProfile, activeJobs, incoming, transactions, navigate, setSelectedJobId, setSelectedRequestId } = useApp();
  const todayEarnings = transactions.slice(0, 3).reduce((s, t) => s + t.net, 0);

  return (
    <Screen className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary rounded-b-[40px] px-5 pt-8 pb-10">
          <View className="flex-row items-center gap-3">
            <Image source={{ uri: taskerProfile.avatar }} className="w-12 h-12 rounded-2xl border-2 border-white/30" />
            <View className="flex-1">
              <Text className="text-primary-foreground/70 text-[10px] font-bold uppercase">Welcome back,</Text>
              <Text className="text-primary-foreground text-lg font-black">{taskerProfile.name.split(" ")[0]}</Text>
            </View>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Bell size={20} color="white" />
              <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-primary" />
            </TouchableOpacity>
          </View>

          <Card className="mt-6 p-4 flex-row items-center gap-4 bg-white shadow-none">
            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${online ? "bg-emerald-500" : "bg-gray-200"}`}>
              <Zap size={20} color={online ? "white" : "#999"} />
            </View>
            <View className="flex-1">
              <Text className="font-black text-sm">{online ? "You're Online" : "You're Offline"}</Text>
              <Text className="text-[10px] text-gray-500">{online ? "Receiving nearby requests" : "Toggle on to get jobs"}</Text>
            </View>
            <Switch 
              value={online} 
              onValueChange={setOnline} 
              trackColor={{ false: "#e5e7eb", true: "#10b981" }}
              thumbColor="white"
            />
          </Card>
        </View>

        <View className="px-5 -mt-6 gap-y-6 pb-24">
          <View className="flex-row flex-wrap justify-between">
            <StatCard icon={Wallet} label="Today" value={`$${todayEarnings.toFixed(0)}`} trend="+12%" />
            <StatCard icon={Briefcase} label="Active" value={activeJobs.length.toString()} trend={`${incoming.length} new`} />
          </View>

          <Section title="Incoming requests" action="View all" onAction={() => navigate("tIncoming")}>
            {incoming.slice(0, 2).map((r) => (
              <TouchableOpacity key={r.id} onPress={() => { setSelectedRequestId(r.id); navigate("tOrderRequest"); }}>
                <Card className="p-4 mb-2">
                  <View className="flex-row items-center gap-3">
                    <Image source={{ uri: r.customer.avatar }} className="w-11 h-11 rounded-2xl" />
                    <View className="flex-1">
                      <Text className="font-bold text-sm" numberOfLines={1}>{r.customer.name}</Text>
                      <Text className="text-[10px] text-gray-500">{r.service} · {r.distanceKm} km</Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-black text-primary text-base">${r.earnings}</Text>
                      <Text className="text-[9px] text-gray-400">{r.scheduledAt.split(",")[1]}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </Section>

          <Section title="Nearby jobs" action="Map" onAction={() => navigate("tNearby")}>
            <TouchableOpacity onPress={() => navigate("tNearby")} activeOpacity={0.9}>
              <Card className="p-0 overflow-hidden border-0">
                <View className="h-32 bg-secondary items-center justify-center">
                   <Svg height="100%" width="100%" viewBox="0 0 400 200">
                    <Path d="M0 90 Q 100 50 200 90 T 400 90" stroke="#A8E6CF" strokeWidth="2" fill="none" />
                    <CircleDot size={20} color="#2E7D5B" style={{ position: 'absolute', left: 100, top: 40 }} />
                   </Svg>
                   <View className="absolute flex-row items-center bg-white px-3 py-2 rounded-full shadow-sm">
                      <MapPin size={14} color="#2E7D5B" />
                      <Text className="text-xs font-bold ml-1 text-foreground">{incoming.length} jobs within 5 km</Text>
                   </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Section>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* =========================== Earnings & Chart =========================== */
export function EarningsScreen() {
  const { transactions, navigate, weeklyEarnings, earningsLoading } = useApp();
  const [range, setRange] = useState<"week" | "month">("week");
  const data = range === "week" ? weeklyEarnings : monthlyEarnings;
  const max = Math.max(...data, 1);
  const balance = transactions.reduce((s, t) => s + t.net, 0);

  return (
    <Screen className="bg-background">
      <View className="bg-primary rounded-b-[40px] px-5 pt-10 pb-12 items-center">
        <Text className="text-primary-foreground/70 font-bold text-xs uppercase tracking-widest">Available balance</Text>
        <Text className="text-4xl font-black text-primary-foreground mt-1">${balance.toFixed(2)}</Text>
        <TouchableOpacity 
          onPress={() => navigate("tWithdraw")}
          className="mt-6 bg-white px-8 py-3 rounded-2xl flex-row items-center gap-2 shadow-sm"
        >
          <Wallet size={18} color="#2E7D5B" />
          <Text className="text-primary font-black">Withdraw</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-5 -mt-6">
        <Card className="p-5 shadow-lg">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-black text-lg">Earnings</Text>
            <View className="flex-row bg-gray-100 p-1 rounded-xl">
              {["week", "month"].map((r: any) => (
                <TouchableOpacity key={r} onPress={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-lg ${range === r ? "bg-white shadow-sm" : ""}`}>
                  <Text className={`text-[10px] font-black uppercase ${range === r ? "text-primary" : "text-gray-400"}`}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row items-end justify-between h-40 px-2">
            {data.map((n, i) => (
              <View key={i} className="items-center w-8">
                <View 
                  style={{ height: `${(n / max) * 100}%`, minHeight: 4 }} 
                  className="w-full bg-primary rounded-t-lg" 
                />
                <Text className="text-[9px] font-bold text-gray-400 mt-2">
                  {range === 'week' ? ["M","T","W","T","F","S","S"][i] : `W${i+1}`}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View className="mt-8">
          <Text className="font-black text-lg mb-4">Recent Transactions</Text>
          {transactions.slice(0, 5).map((t) => (
            <TouchableOpacity key={t.id} onPress={() => navigate("tEarningDetail")}>
              <View className="flex-row items-center py-4 border-b border-gray-50">
                 <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center mr-3">
                    <Briefcase size={20} color="#2E7D5B" />
                 </View>
                 <View className="flex-1">
                    <Text className="font-bold text-sm" numberOfLines={1}>{t.service}</Text>
                    <Text className="text-[10px] text-gray-400">{t.customer} · {t.date}</Text>
                 </View>
                 <Text className="font-black text-emerald-600">+$ {t.net.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

/* =========================== Missing Screens =========================== */

export function TaskerDocumentsScreen() {
  const { navigate, user, taskerProfile, documents, setDocuments } = useApp();

  const [fullName, setFullName] = useState(
    documents.kyc?.fullName ?? taskerProfile.name ?? user.name ?? "",
  );
  const [dob, setDob] = useState(documents.kyc?.dob ?? "");
  const [address, setAddress] = useState(documents.kyc?.address ?? "");
  const [phone, setPhone] = useState(documents.kyc?.phone ?? user.phone ?? "");
  const [cccdFront, setCccdFront] = useState<PickedImage | null>(
    documents.kyc?.cccdFront ?? null,
  );
  const [cccdBack, setCccdBack] = useState<PickedImage | null>(
    documents.kyc?.cccdBack ?? null,
  );

  const personalComplete =
    fullName.trim().length >= 2 &&
    dob.trim().length >= 8 &&
    address.trim().length >= 5 &&
    phone.trim().length >= 8;

  const canSubmit = personalComplete && Boolean(cccdFront) && Boolean(cccdBack);
  const [submitting, setSubmitting] = useState(false);

  const kycApiErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { error?: { message?: string } } | undefined;
      return body?.error?.message || err.message || "Không thể kết nối tới server";
    }
    if (isApiError(err)) {
      return err.message || "Không thể kết nối tới server";
    }
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return "Không thể kết nối tới server";
  };

  const submit = async () => {
    if (!canSubmit || !cccdFront || !cccdBack || submitting) return;

    setSubmitting(true);
    try {
      console.log(">>> [MOBILE KYC] API base URL:", config.apiUrl);

      const cccdFrontDataUri = await toBackendKycDataUri(cccdFront);
      const cccdBackDataUri = await toBackendKycDataUri(cccdBack);

      const apiBody = {
        fullName: fullName.trim(),
        dob: dob.trim(),
        address: address.trim(),
        phone: phone.trim(),
        cccdFront: cccdFrontDataUri,
        cccdBack: cccdBackDataUri,
      };

      console.log(">>> [MOBILE KYC] POST /users/me/kyc payload (images truncated)", {
        ...apiBody,
        cccdFront: `${apiBody.cccdFront.slice(0, 48)}…`,
        cccdBack: `${apiBody.cccdBack.slice(0, 48)}…`,
      });

      const updatedUser = await submitKycRequest(apiBody);

      console.log(">>> [MOBILE KYC] Success — server kyc:", updatedUser.kyc);

      const payload: TaskerKycPayload = {
        fullName: apiBody.fullName,
        dob: apiBody.dob,
        address: apiBody.address,
        phone: apiBody.phone,
        cccdFront: {
          previewUri: cccdFront.previewUri,
          persistUri: cccdFrontDataUri,
        },
        cccdBack: {
          previewUri: cccdBack.previewUri,
          persistUri: cccdBackDataUri,
        },
        submittedAt: updatedUser.kyc?.submittedAt ?? new Date().toISOString(),
      };

      setDocuments({
        status: "pending",
        submittedForReview: true,
        kyc: payload,
      });

      navigate("tPending");
    } catch (err) {
      console.log(">>> [MOBILE API ERROR]:", axios.isAxiosError(err) ? err.response?.data : err);
      Alert.alert("Lỗi nộp hồ sơ", kycApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Identity verification" />
      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Text className="text-xl font-black text-foreground">Verify your identity</Text>
        <Text className="text-sm text-muted-foreground mt-2 mb-6 leading-5">
          Enter your details and upload both sides of your national ID (CCCD) before we send your
          application for review.
        </Text>

        <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
          Personal information
        </Text>
        <View className="gap-y-4 mb-8">
          <Field label="Full name">
            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyen Van A"
              autoCapitalize="words"
            />
          </Field>
          <Field label="Date of birth">
            <Input
              value={dob}
              onChangeText={setDob}
              placeholder="DD/MM/YYYY"
              keyboardType="numbers-and-punctuation"
            />
          </Field>
          <Field label="Address">
            <Input
              value={address}
              onChangeText={setAddress}
              placeholder="Street, ward, district, city"
              multiline
              className="min-h-[88px] align-top py-3"
            />
          </Field>
          <Field label="Phone number">
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="+84 9xx xxx xxx"
              keyboardType="phone-pad"
            />
          </Field>
        </View>

        <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
          National ID (CCCD)
        </Text>
        <View className="gap-y-4 mb-6">
          <CccdUploadSlot
            label="Tap to upload front of CCCD"
            image={cccdFront}
            onPick={() => pickIdImageWithSourceMenu(setCccdFront)}
          />
          <CccdUploadSlot
            label="Tap to upload back of CCCD"
            image={cccdBack}
            onPick={() => pickIdImageWithSourceMenu(setCccdBack)}
          />
        </View>

        <View className="bg-blue-50 p-4 rounded-2xl flex-row gap-3">
          <AlertTriangle size={20} color="#1d4ed8" />
          <View className="flex-1">
            <Text className="font-bold text-blue-900 text-sm">Before you submit</Text>
            <Text className="text-xs text-blue-800/90 mt-1 leading-4">
              Make sure photos are clear, uncropped, and match the information above. Admin review
              usually takes 24–48 hours.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="p-5 border-t border-border bg-white">
        <PrimaryButton onClick={submit} disabled={!canSubmit || submitting} loading={submitting}>
          Submit for Review
        </PrimaryButton>
        {!canSubmit ? (
          <Text className="text-center text-xs text-muted-foreground mt-3">
            Complete all fields and upload both sides of your CCCD to continue.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

function CccdUploadSlot({
  label,
  image,
  onPick,
}: {
  label: string;
  image: PickedImage | null;
  onPick: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPick}
      activeOpacity={0.85}
      className="rounded-2xl border-2 border-dashed border-border bg-muted/30 overflow-hidden min-h-[168px]"
    >
      {image ? (
        <View className="relative w-full h-[200px]">
          <Image
            source={{ uri: image.previewUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-x-0 bottom-0 bg-black/50 py-2 px-3">
            <Text className="text-white text-xs font-bold text-center">Tap to replace</Text>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center py-10 px-4">
          <View className="w-14 h-14 rounded-2xl bg-secondary items-center justify-center mb-3">
            <Camera size={28} color="#2E7D5B" />
          </View>
          <Text className="font-bold text-sm text-foreground text-center">{label}</Text>
          <Text className="text-[11px] text-muted-foreground mt-1 text-center">
            Camera or photo album
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function TaskerPendingScreen() {
  const { logout } = useApp();
  return (
    <Screen className="bg-background">
      <View className="flex-1 items-center justify-center px-10">
        <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center mb-6">
          <Timer size={48} color="#2E7D5B" />
        </View>
        <Text className="text-2xl font-black text-center mb-2">Application Pending</Text>
        <Text className="text-muted-foreground text-center mb-10">We're reviewing your profile. We'll notify you once you're approved to start tasking!</Text>
        <PrimaryButton onClick={logout}>Sign out</PrimaryButton>
      </View>
    </Screen>
  );
}

export function TaskerRejectedScreen() {
  const { logout } = useApp();
  return (
    <Screen className="bg-background">
      <View className="flex-1 items-center justify-center px-10">
        <View className="w-24 h-24 rounded-full bg-red-50 items-center justify-center mb-6">
          <AlertTriangle size={48} color="#b91c1c" />
        </View>
        <Text className="text-2xl font-black text-center mb-2">Application Not Approved</Text>
        <Text className="text-muted-foreground text-center mb-10">
          Your tasker application was not approved. Contact support if you believe this is a mistake.
        </Text>
        <PrimaryButton onClick={logout}>Sign out</PrimaryButton>
      </View>
    </Screen>
  );
}

export function IncomingOrdersScreen() {
  const { incoming, navigate, setSelectedRequestId } = useApp();
  return (
    <Screen className="bg-background">
      <TopBar title="Incoming Requests" />
      <FlatList
        data={incoming}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item: r }) => (
          <TouchableOpacity onPress={() => { setSelectedRequestId(r.id); navigate("tOrderRequest"); }} className="mb-4">
            <Card className="p-4">
              <View className="flex-row items-center gap-3">
                <Image source={{ uri: r.customer.avatar }} className="w-14 h-14 rounded-2xl" />
                <View className="flex-1">
                  <Text className="font-bold text-base">{r.customer.name}</Text>
                  <Text className="text-xs text-muted-foreground">{r.service} · {r.distanceKm} km away</Text>
                </View>
                <View className="items-end">
                  <Text className="font-black text-primary text-lg">${r.earnings}</Text>
                  <Text className="text-[10px] text-muted-foreground">{r.scheduledAt}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

export function NearbyJobsScreen() {
  const { incoming, navigate, setSelectedRequestId, online } = useApp();

  if (!online) {
    return (
      <Screen className="bg-background">
        <TopBar title="Nearby Jobs" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted-foreground text-center">
            Go online on your dashboard to receive nearby job requests in real time.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-background">
      <TopBar title="Nearby Jobs" />
      <FlatList
        data={incoming}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <MapPin size={48} color="#10b981" />
            <Text className="font-bold mt-4">No nearby jobs right now</Text>
            <Text className="text-sm text-muted-foreground text-center mt-2">
              Published orders within your radius will appear here automatically.
            </Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedRequestId(r.id);
              navigate("tOrderRequest");
            }}
            className="mb-4"
          >
            <Card className="p-4">
              <View className="flex-row items-center gap-3">
                <Image source={{ uri: r.customer.avatar }} className="w-12 h-12 rounded-2xl" />
                <View className="flex-1">
                  <Text className="font-bold">{r.service}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {r.distanceKm} km · ${r.earnings}
                  </Text>
                </View>
                <ChevronRight size={18} color="#9ca3af" />
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

export { OrderRequestDetailScreen } from "@/screens/tasker/OrderRequestDetailScreen";

const JOBS_TABS: TaskerJobsTab[] = ["Active", "Completed", "Cancelled"];

function jobStatusChipLabel(job: TaskerJob): string {
  switch (job.apiStatus) {
    case "pending":
      return "Pending";
    case "pending_payment":
      return "Payment Pending";
    case "accepted":
      return "Accepted";
    case "arrived":
      return "Arrived";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return job.status;
  }
}

function JobsEmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <Briefcase size={48} color="#94a3b8" />
      <Text className="font-bold text-foreground mt-4 text-center">{message}</Text>
      <Text className="text-sm text-muted-foreground mt-2 text-center leading-5">
        Jobs you accept or complete will appear here for easy reference.
      </Text>
    </View>
  );
}

function JobHistoryCard({
  job,
  onPress,
}: {
  job: TaskerJob;
  onPress: () => void;
}) {
  const terminal = job.isTerminal;
  const isCompleted = job.apiStatus === "completed";
  const isCancelled = job.apiStatus === "cancelled";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="mb-4"
      disabled={false}
    >
      <Card className="p-4 border-border">
        <View className="flex-row items-start justify-between mb-3 gap-2">
          {terminal ? (
            <View
              className={`px-3 py-1.5 rounded-full ${
                isCompleted ? "bg-emerald-100" : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-[10px] font-black uppercase ${
                  isCompleted ? "text-emerald-800" : "text-gray-600"
                }`}
              >
                {isCompleted
                  ? `Completed · $${job.totalEarning.toFixed(2)}`
                  : "Cancelled"}
              </Text>
            </View>
          ) : (
            <View className="bg-secondary px-3 py-1 rounded-full">
              <Text className="text-[10px] font-black text-primary uppercase">
                {jobStatusChipLabel(job)}
              </Text>
            </View>
          )}
          <Text className="text-xs text-muted-foreground shrink-0">{job.scheduledAt}</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Image source={{ uri: job.customer.avatar }} className="w-12 h-12 rounded-2xl" />
          <View className="flex-1">
            <Text className="font-bold text-base text-foreground">{job.customer.name}</Text>
            <Text className="text-xs text-muted-foreground">{job.service}</Text>
            {!terminal ? (
              <Text className="text-xs font-semibold text-primary mt-1">
                Est. ${job.earnings.toFixed(2)}
              </Text>
            ) : null}
          </View>
          <ChevronRight size={18} color="#9ca3af" />
        </View>

        {terminal && isCancelled ? (
          <Text className="text-[11px] text-muted-foreground mt-3">
            This job was cancelled and cannot be updated.
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

export function ActiveJobsScreen() {
  const { taskerJobs, navigate, setSelectedJobId } = useApp();
  const [currentTab, setCurrentTab] = useState<TaskerJobsTab>("Active");

  const filteredJobs = useMemo(
    () => sortTaskerJobsBySchedule(filterTaskerJobsForTab(taskerJobs, currentTab)),
    [taskerJobs, currentTab],
  );

  return (
    <Screen className="bg-background">
      <TopBar title="Jobs" />
      <View className="flex-row border-b border-border bg-card px-2">
        {JOBS_TABS.map((tab) => {
          const active = currentTab === tab;
          const count = filterTaskerJobsForTab(taskerJobs, tab).length;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setCurrentTab(tab)}
              className={`flex-1 py-3 items-center border-b-2 ${
                active ? "border-primary" : "border-transparent"
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab}
              </Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{
          padding: 20,
          flexGrow: 1,
        }}
        ListEmptyComponent={<JobsEmptyState message={emptyStateMessageForJobsTab(currentTab)} />}
        renderItem={({ item: j }) => (
          <JobHistoryCard
            job={j}
            onPress={() => {
              setSelectedJobId(j.id);
              navigate("tJobDetail");
            }}
          />
        )}
      />
    </Screen>
  );
}

export function JobDetailScreen() {
  const { taskerJobs, selectedJobId, navigate, openChatForOrder } = useApp();
  const j = taskerJobs.find((x) => x.id === selectedJobId) ?? taskerJobs[0];
  if (!j) {
    return (
      <Screen className="bg-background">
        <TopBar title="Job Details" />
        <JobsEmptyState message="No active jobs found" />
      </Screen>
    );
  }

  const terminal = j.isTerminal;

  return (
    <Screen className="bg-background">
      <TopBar title="Job Details" />
      <ScrollView className="px-5 pt-4">
        <Card className="p-4 mb-4">
          <View className="flex-row items-center gap-3">
            <Image source={{ uri: j.customer.avatar }} className="w-14 h-14 rounded-2xl" />
            <View className="flex-1">
              <Text className="font-black text-lg">{j.customer.name}</Text>
              <Text className="text-xs text-muted-foreground">{j.service}</Text>
              {j.apiStatus === "completed" ? (
                <Text className="text-xs font-bold text-emerald-700 mt-1">
                  Earned ${j.totalEarning.toFixed(2)}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
              <Phone size={20} color="#2E7D5B" />
            </TouchableOpacity>
          </View>
        </Card>

        <Card className="p-4 gap-y-4 mb-6">
          <DetailRow icon={MapPin} label="Address" value={j.customer.address} />
          <DetailRow icon={Clock} label="Time" value={j.scheduledAt} />
          <DetailRow
            icon={MessageCircle}
            label="Contact"
            value="Message Customer"
            onPress={() => openChatForOrder(j.id).catch(() => undefined)}
          />
        </Card>

        {terminal ? (
          <Card className="p-4 mb-4 bg-muted/30">
            <Text className="text-sm text-muted-foreground text-center">
              {j.apiStatus === "completed"
                ? "This job is completed. Status updates are locked."
                : "This job was cancelled. No further actions are available."}
            </Text>
          </Card>
        ) : (
          <>
            <PrimaryButton onClick={() => navigate("tNavigation")} className="mb-3">
              Navigate to Job
            </PrimaryButton>
            <PrimaryButton onClick={() => navigate("tJobStatus")} variant="outline">
              Update Status
            </PrimaryButton>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

export function JobStatusScreen() {
  const { taskerJobs, selectedJobId, navigate, advanceJob, orders, refreshOrder } = useApp();
  const [loading, setLoading] = useState(false);
  const j = taskerJobs.find((x) => x.id === selectedJobId) ?? taskerJobs[0];
  if (!j) return null;

  useEffect(() => {
    if (j.id) refreshOrder(j.id).catch(() => undefined);
  }, [j.id, refreshOrder]);

  if (j.isTerminal) {
    return (
      <Screen className="bg-background">
        <TopBar title="Update Status" />
        <View className="p-5">
          <Card className="p-4">
            <Text className="font-black text-lg capitalize">{jobStatusChipLabel(j)}</Text>
            <Text className="text-sm text-muted-foreground mt-2">
              This job is closed. You cannot change its status anymore.
            </Text>
          </Card>
        </View>
      </Screen>
    );
  }

  const order = orders.find((o) => o.id === j.id);
  const apiStatus = order?.apiStatus ?? j.apiStatus;
  const current = apiStatusToTaskerJobStatus(apiStatus) ?? j.status;
  const nextAction = getNextTaskerStatusAction(apiStatus);
  const blockedMessage = taskerStatusBlockedMessage(apiStatus);

  const runAction = async () => {
    if (!nextAction) return;
    setLoading(true);
    try {
      await advanceJob(j.id, nextAction.action);
      if (nextAction.action === "complete") navigate("tDashboard");
    } catch (err) {
      Alert.alert("Update failed", authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    accepted: "Accepted",
    arrived: "Arrived",
    working: "In progress",
    completed: "Completed",
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Update Status" />
      <View className="px-5 pt-6 gap-y-3">
        <Card className="p-4 mb-2">
          <Text className="text-xs text-muted-foreground uppercase font-bold">Current status</Text>
          <Text className="font-black text-lg mt-1 capitalize">
            {statusLabels[current] ?? current}
          </Text>
        </Card>

        {(["accepted", "arrived", "working", "completed"] as const).map((s) => {
          const isCurrent = current === s;
          const isPast =
            (s === "accepted" && ["arrived", "working", "completed"].includes(current)) ||
            (s === "arrived" && ["working", "completed"].includes(current)) ||
            (s === "working" && current === "completed");
          return (
            <View
              key={s}
              className={`p-5 rounded-2xl border-2 flex-row items-center justify-between ${
                isCurrent ? "border-primary bg-secondary" : isPast ? "border-emerald-100 bg-emerald-50" : "border-gray-100 bg-white"
              }`}
            >
              <Text className="font-bold capitalize">{statusLabels[s]}</Text>
              {(isCurrent || isPast) && <Check size={20} color="#2E7D5B" />}
            </View>
          );
        })}

        {nextAction ? (
          <PrimaryButton onClick={runAction} disabled={loading} loading={loading} className="mt-4">
            {nextAction.label}
          </PrimaryButton>
        ) : blockedMessage ? (
          <Text className="text-center text-muted-foreground mt-4 leading-5">{blockedMessage}</Text>
        ) : (
          <Text className="text-center text-muted-foreground mt-4">No further updates for this job.</Text>
        )}
      </View>
    </Screen>
  );
}

export function NavigationScreen() {
  const { navigate, selectedJobId, advanceJob, taskerJobs, orders, refreshOrder } = useApp();
  const [loading, setLoading] = useState(false);
  const job = taskerJobs.find((j) => j.id === selectedJobId) ?? taskerJobs[0];

  useEffect(() => {
    if (job?.id) refreshOrder(job.id).catch(() => undefined);
  }, [job?.id, refreshOrder]);

  const order = job ? orders.find((o) => o.id === job.id) : undefined;
  const apiStatus = order?.apiStatus ?? job?.apiStatus;
  const nextAction = getNextTaskerStatusAction(apiStatus);
  const blockedMessage = taskerStatusBlockedMessage(apiStatus);

  if (!job || job.isTerminal) {
    return (
      <Screen className="bg-background">
        <TopBar title="Navigation" />
        <View className="p-5">
          <Text className="text-muted-foreground text-center">
            Navigation is not available for closed jobs.
          </Text>
        </View>
      </Screen>
    );
  }

  const runNextAction = async () => {
    if (!job || !nextAction) return;
    setLoading(true);
    try {
      await advanceJob(job.id, nextAction.action);
      if (nextAction.action === "complete") {
        navigate("tDashboard");
      } else {
        navigate("tJobStatus");
      }
    } catch (err) {
      Alert.alert("Update failed", authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen className="bg-background">
      <View className="flex-1 bg-secondary items-center justify-center px-8">
        <NavIcon size={64} color="#2E7D5B" />
        <Text className="font-black text-xl mt-4 text-foreground">Navigation Active</Text>
        {job ? (
          <Text className="text-muted-foreground text-center mt-2">{job.customer.address}</Text>
        ) : null}
        {blockedMessage ? (
          <Text className="text-muted-foreground text-center mt-6 leading-5 px-2">
            {blockedMessage}
          </Text>
        ) : null}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2E7D5B" />
        ) : nextAction ? (
          <PrimaryButton onClick={runNextAction} className="mt-10 w-48">
            {nextAction.label}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={() => navigate("tJobStatus")}
            variant="outline"
            className="mt-10 w-48"
          >
            View job status
          </PrimaryButton>
        )}
      </View>
    </Screen>
  );
}

export function CustomerInfoScreen() {
  return (
    <Screen className="bg-background">
      <TopBar title="Customer Info" />
      <View className="flex-1 items-center justify-center">
        <User2 size={48} color="#6b7280" />
        <Text className="font-bold mt-4">Customer Details</Text>
      </View>
    </Screen>
  );
}

export function ServiceProgressScreen() {
  return (
    <Screen className="bg-background">
      <TopBar title="Service Progress" />
      <View className="flex-1 items-center justify-center">
        <RotateCcw size={48} color="#2E7D5B" />
        <Text className="font-bold mt-4 text-foreground">Progress Tracker</Text>
      </View>
    </Screen>
  );
}

export function EarningDetailScreen() {
  return (
    <Screen className="bg-background">
      <TopBar title="Transaction Detail" />
      <View className="flex-1 items-center justify-center">
        <FileText size={48} color="#2E7D5B" />
        <Text className="font-bold mt-4 text-foreground">Transaction Details</Text>
      </View>
    </Screen>
  );
}

export function WithdrawScreen() {
  return (
    <Screen className="bg-background">
      <TopBar title="Withdraw" />
      <View className="flex-1 items-center justify-center">
        <Wallet size={48} color="#2E7D5B" />
        <Text className="font-bold mt-4 text-foreground">Withdraw Funds</Text>
      </View>
    </Screen>
  );
}

export function TaskerReviewsScreen() {
  const { authUser, taskerReviewsCache, taskerReviewsLoading, loadTaskerReviews } = useApp();
  const taskerId = authUser?.id;
  const view = taskerId ? taskerReviewsCache[taskerId] : undefined;

  React.useEffect(() => {
    if (taskerId) loadTaskerReviews(taskerId).catch(() => undefined);
  }, [taskerId, loadTaskerReviews]);

  return (
    <Screen className="bg-background">
      <TopBar title="Reviews" />
      {taskerReviewsLoading && !view ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {view ? (
            <>
              <Card className="p-5 mb-4 items-center">
                <Text className="text-4xl font-black text-primary">{view.averageRating.toFixed(1)}</Text>
                <View className="flex-row mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      color={i <= Math.round(view.averageRating) ? "#fbbf24" : "#e5e7eb"}
                      fill={i <= Math.round(view.averageRating) ? "#fbbf24" : "transparent"}
                    />
                  ))}
                </View>
                <Text className="text-sm text-muted-foreground mt-2">
                  {view.totalReviews} review{view.totalReviews !== 1 ? "s" : ""}
                </Text>
              </Card>
              {view.reviews.map((r) => (
                <Card key={r.id} className="p-4 mb-3">
                  <View className="flex-row items-center gap-3 mb-2">
                    {r.customerAvatar ? (
                      <Image source={{ uri: r.customerAvatar }} className="w-10 h-10 rounded-full" />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-muted" />
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-sm">{r.customerName}</Text>
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={12}
                            color={i <= r.rating ? "#fbbf24" : "#e5e7eb"}
                            fill={i <= r.rating ? "#fbbf24" : "transparent"}
                          />
                        ))}
                      </View>
                    </View>
                    <Text className="text-xs text-muted-foreground">{r.date}</Text>
                  </View>
                  {r.comment ? (
                    <Text className="text-sm text-muted-foreground">{r.comment}</Text>
                  ) : null}
                </Card>
              ))}
            </>
          ) : (
            <View className="items-center py-20">
              <Star size={48} color="#fbbf24" fill="#fbbf24" />
              <Text className="font-bold mt-4 text-foreground">No reviews yet</Text>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

export { TaskerProfilePageScreen } from "@/screens/tasker/TaskerProfilePage";

export function EditServicesScreen() {
  return (
    <Screen className="bg-background">
      <TopBar title="My Services" />
      <View className="flex-1 items-center justify-center">
        <Edit3 size={48} color="#2E7D5B" />
        <Text className="font-bold mt-4 text-foreground">Manage Services</Text>
      </View>
    </Screen>
  );
}

function DocRow({ icon: Icon, label, status }: any) {
  return (
    <Card className="p-4 mb-3 flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-xl bg-muted items-center justify-center">
        <Icon size={20} color="#666" />
      </View>
      <Text className="flex-1 font-bold text-sm text-foreground">{label}</Text>
      <View className={`px-3 py-1 rounded-full ${status === 'Uploaded' ? 'bg-secondary' : 'bg-muted'}`}>
        <Text className={`text-[10px] font-black uppercase ${status === 'Uploaded' ? 'text-primary' : 'text-gray-400'}`}>{status}</Text>
      </View>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} className="flex-row items-start gap-3">
      <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
        <Icon size={20} color="#2E7D5B" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-muted-foreground font-bold uppercase">{label}</Text>
        <Text className="font-bold text-sm text-foreground">{value}</Text>
      </View>
      {onPress && <ChevronRight size={18} color="#94a3b8" />}
    </TouchableOpacity>
  );
}

/* =========================== Helper Components =========================== */

function StatCard({ icon: Icon, label, value, trend }: any) {
  return (
    <Card className="w-[48%] p-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-9 h-9 rounded-xl bg-secondary items-center justify-center">
          <Icon size={18} color="#2E7D5B" />
        </View>
        <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
          <Text className="text-[9px] font-bold text-emerald-700">{trend}</Text>
        </View>
      </View>
      <Text className="text-2xl font-black text-foreground">{value}</Text>
      <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{label}</Text>
    </Card>
  );
}

function Section({ title, action, onAction, children }: any) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-black text-lg">{title}</Text>
        {action && (
          <TouchableOpacity onPress={onAction}>
            <Text className="text-sm font-bold text-primary">{action}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}
import { useApp } from "@/screens/AppContext";
import { Card, PrimaryButton, Screen, TopBar } from "@/screens/ui";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  Briefcase,
  Calendar,
  MapPin,
  Star,
  Wallet,
} from "lucide-react-native";
import { useOrderAcceptGuard } from "@/hooks/useOrderAcceptGuard";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <Icon size={18} color="#6b7280" />
      <View className="flex-1">
        <Text className="text-xs text-gray-500 font-semibold">{label}</Text>
        <Text className="font-bold text-gray-900 mt-0.5">{value}</Text>
      </View>
    </View>
  );
}

export function OrderRequestDetailScreen() {
  const {
    incoming,
    selectedRequestId,
    navigate,
    acceptJob,
    rejectJob,
    acceptJobError,
    clearAcceptJobError,
  } = useApp();
  const r = incoming.find((x) => x.id === selectedRequestId) || incoming[0];
  if (!r) return null;

  const { handleAccept, loading, isAcceptDisabled } = useOrderAcceptGuard(
    async () => {
      clearAcceptJobError();
      await acceptJob(r.id);
      navigate("tJobs");
    },
  );

  const onAcceptPress = async () => {
    try {
      await handleAccept();
    } catch (err) {
      Alert.alert("Could not accept", authErrorMessage(err));
    }
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Job Request" />
      <ScrollView className="px-5 pt-4">
        <Card className="p-4 mb-4 items-center">
          <Image source={{ uri: r.customer.avatar }} className="w-20 h-20 rounded-full mb-3" />
          <Text className="font-black text-xl">{r.customer.name}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Text className="font-bold">4.8</Text>
          </View>
        </Card>

        <Card className="p-4 gap-y-4 mb-6">
          <DetailRow icon={Briefcase} label="Service" value={r.service} />
          <DetailRow icon={Calendar} label="Date" value={r.scheduledAt} />
          <DetailRow icon={MapPin} label="Location" value={r.customer.address} />
          <DetailRow icon={Wallet} label="Earnings" value={`$${r.earnings}`} />
        </Card>
        {acceptJobError ? (
          <Text className="text-sm text-red-600 font-semibold text-center mb-4">{acceptJobError}</Text>
        ) : null}
      </ScrollView>
      <View className="p-5 border-t border-border flex-row gap-3 bg-white">
        <TouchableOpacity
          onPress={() => {
            rejectJob(r.id);
            navigate("tIncoming");
          }}
          className="flex-1 h-14 rounded-2xl bg-gray-100 items-center justify-center"
        >
          <Text className="font-bold text-gray-600">Decline</Text>
        </TouchableOpacity>
        <View className="flex-[2]">
          <PrimaryButton
            onClick={onAcceptPress}
            disabled={isAcceptDisabled}
            loading={loading}
          >
            Accept Job
          </PrimaryButton>
        </View>
      </View>
    </Screen>
  );
}

import React, { useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "@/components/ui/calendar";
import { Select } from "@/components/ui/select";
import { Card } from "@/screens/ui";
import { Clock, Zap } from "lucide-react-native";
import { addDays } from "date-fns";
import {
  formatDisplayDate,
  formatLocalDateIso,
  formatTimeSlot,
  getAvailableHours,
  getAvailableMinutes,
  localDateFromParts,
  MINUTE_OPTIONS,
  roundToNextQuarterHour,
} from "@/lib/scheduling/localDateTime";

export type ScheduleMode = "instant" | "scheduled";

type BookingSchedulePickerProps = {
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
  dateIso: string;
  hour: number;
  minute: number;
  onDateIsoChange: (dateIso: string) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  validationError?: string | null;
};

export function BookingSchedulePicker({
  mode,
  onModeChange,
  dateIso,
  hour,
  minute,
  onDateIsoChange,
  onHourChange,
  onMinuteChange,
  validationError,
}: BookingSchedulePickerProps) {
  const selectedDate = useMemo(
    () => localDateFromParts(dateIso, 12, 0),
    [dateIso],
  );

  const availableHours = useMemo(() => getAvailableHours(dateIso), [dateIso]);
  const availableMinutes = useMemo(
    () => getAvailableMinutes(dateIso, hour),
    [dateIso, hour],
  );

  useEffect(() => {
    if (mode !== "scheduled") return;
    if (!availableHours.includes(hour)) {
      onHourChange(availableHours[0] ?? 0);
    }
  }, [mode, availableHours, hour, onHourChange]);

  useEffect(() => {
    if (mode !== "scheduled") return;
    if (availableMinutes.includes(minute)) return;

    if (availableMinutes.length > 0) {
      onMinuteChange(availableMinutes[0]);
      return;
    }

    const nextHour = availableHours.find((h) => h > hour);
    if (nextHour != null) {
      onHourChange(nextHour);
      return;
    }

    const tomorrow = addDays(localDateFromParts(dateIso, 12, 0), 1);
    onDateIsoChange(formatLocalDateIso(tomorrow));
    onHourChange(0);
    onMinuteChange(0);
  }, [
    mode,
    availableMinutes,
    availableHours,
    minute,
    hour,
    dateIso,
    onMinuteChange,
    onHourChange,
    onDateIsoChange,
  ]);

  const instantSlot = roundToNextQuarterHour(new Date());

  const hourOptions = availableHours.map((h) => ({
    label: String(h).padStart(2, "0"),
    value: String(h),
  }));

  const minuteOptions = availableMinutes.map((m) => ({
    label: String(m).padStart(2, "0"),
    value: String(m),
  }));

  return (
    <View className="gap-4">
      <View className="flex-row rounded-2xl bg-muted p-1">
        <TouchableOpacity
          onPress={() => onModeChange("instant")}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${
            mode === "instant" ? "bg-primary" : ""
          }`}
        >
          <Zap size={16} color={mode === "instant" ? "#fff" : "#6b7280"} />
          <Text
            className={`font-bold text-sm ${
              mode === "instant" ? "text-white" : "text-muted-foreground"
            }`}
          >
            Book Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onModeChange("scheduled")}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${
            mode === "scheduled" ? "bg-primary" : ""
          }`}
        >
          <Clock size={16} color={mode === "scheduled" ? "#fff" : "#6b7280"} />
          <Text
            className={`font-bold text-sm ${
              mode === "scheduled" ? "text-white" : "text-muted-foreground"
            }`}
          >
            Schedule Later
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "instant" ? (
        <Card className="p-4 bg-emerald-50/80 border-emerald-100">
          <Text className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            As soon as possible
          </Text>
          <Text className="text-sm text-foreground leading-5">
            We will match a nearby tasker right away. Your request starts at the next
            available 15-minute slot (
            {formatDisplayDate(instantSlot.dateIso)} ·{" "}
            {formatTimeSlot(instantSlot.hour, instantSlot.minute)}).
          </Text>
        </Card>
      ) : (
        <>
          <View>
            <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              Select a date
            </Text>
            <Calendar
              selectedDate={selectedDate}
              onDateChange={(d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                onDateIsoChange(`${y}-${m}-${day}`);
              }}
              minDate={new Date()}
            />
          </View>

          <View>
            <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              Select a time
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-muted-foreground mb-2 uppercase">
                  Hour
                </Text>
                <Select
                  options={hourOptions}
                  value={String(hour)}
                  onValueChange={(v) => onHourChange(parseInt(v, 10))}
                  placeholder="Hour"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-muted-foreground mb-2 uppercase">
                  Minute
                </Text>
                <Select
                  options={minuteOptions}
                  value={String(minute)}
                  onValueChange={(v) => onMinuteChange(parseInt(v, 10))}
                  placeholder="Min"
                />
              </View>
            </View>
            <Text className="text-sm text-muted-foreground mt-3">
              {formatDisplayDate(dateIso)} at {formatTimeSlot(hour, minute)}
            </Text>
          </View>
        </>
      )}

      {validationError ? (
        <Text className="text-sm text-red-600 font-semibold">{validationError}</Text>
      ) : null}
    </View>
  );
}

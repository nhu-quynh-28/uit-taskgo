import * as React from "react";
import { View, Text, Pressable } from "react-native";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  isBefore,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { cn } from "@/components/lib/utils";

type CalendarProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  /** Dates before this (start of day) cannot be selected. Defaults to today. */
  minDate?: Date;
};

export function Calendar({ selectedDate, onDateChange, minDate }: CalendarProps) {
  const minDay = startOfDay(minDate ?? new Date());
  const [currentMonth, setCurrentMonth] = React.useState(
    startOfMonth(selectedDate ?? minDay),
  );

  React.useEffect(() => {
    if (isBefore(startOfMonth(currentMonth), startOfMonth(minDay))) {
      setCurrentMonth(startOfMonth(minDay));
    }
  }, [currentMonth, minDay]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(startOfMonth(prev), startOfMonth(minDay))) {
      setCurrentMonth(prev);
    }
  };

  const canGoPrev = !isBefore(
    startOfMonth(subMonths(currentMonth, 1)),
    startOfMonth(minDay),
  );

  const renderHeader = () => (
    <View className="flex-row justify-between items-center px-2 py-2">
      <Text className="text-lg font-bold text-foreground">
        {format(currentMonth, "MMMM yyyy")}
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={prevMonth}
          disabled={!canGoPrev}
          className={cn("p-2 active:opacity-50", !canGoPrev && "opacity-30")}
        >
          <ChevronLeft size={22} color="#1A2421" />
        </Pressable>
        <Pressable onPress={nextMonth} className="p-2 active:opacity-50">
          <ChevronRight size={22} color="#1A2421" />
        </Pressable>
      </View>
    </View>
  );

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <View className="flex-row mb-2">
        {days.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-muted-foreground text-xs font-medium">{day}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const rows: React.ReactNode[] = [];
    let days: React.ReactNode[] = [];

    calendarDays.forEach((day, i) => {
      const formattedDate = format(day, "d");
      const isSelected = isSameDay(day, selectedDate);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isPast = isBefore(startOfDay(day), minDay);
      const disabled = isPast || !isCurrentMonth;

      days.push(
        <Pressable
          key={day.toISOString()}
          disabled={disabled}
          onPress={() => {
            if (!isPast) onDateChange(day);
          }}
          className={cn(
            "flex-1 aspect-square items-center justify-center m-0.5 rounded-full",
            isSelected && !isPast && "bg-primary",
            isPast && "opacity-25",
            !isCurrentMonth && "opacity-20",
          )}
        >
          <Text
            className={cn(
              "text-sm",
              isSelected && !isPast
                ? "text-white font-bold"
                : isPast
                  ? "text-muted-foreground"
                  : "text-foreground",
            )}
          >
            {formattedDate}
          </Text>
        </Pressable>,
      );

      if ((i + 1) % 7 === 0) {
        rows.push(
          <View key={`row-${i}`} className="flex-row">
            {days}
          </View>,
        );
        days = [];
      }
    });

    return <View>{rows}</View>;
  };

  return (
    <View className="bg-card p-3 rounded-2xl border border-border">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </View>
  );
}

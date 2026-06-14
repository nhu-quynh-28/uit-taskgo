import {
  buildNewJobAlertMessage,
  formatJobEarnings,
  type ActiveJobAlert,
} from "@/lib/realtime/taskerJobAlert";
import { useApp } from "@/screens/AppContext";
import { Bell, MapPin, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OFF_SCREEN_Y = 420;
const ENTER_DURATION_MS = 320;
const EXIT_DURATION_MS = 260;
const SWIPE_DISTANCE_THRESHOLD = 72;
const SWIPE_VELOCITY_THRESHOLD = 0.45;

type IncomingJobAlertBannerProps = {
  alert: ActiveJobAlert | null;
};

export function IncomingJobAlertBanner({ alert }: IncomingJobAlertBannerProps) {
  const insets = useSafeAreaInsets();
  const {
    dismissActiveJobAlert,
    rejectJob,
    acceptJob,
    navigate,
    setSelectedJobId,
    setSelectedRequestId,
    showToast,
  } = useApp();

  const [rendered, setRendered] = useState<ActiveJobAlert | null>(null);
  const [accepting, setAccepting] = useState(false);
  const isExitingRef = useRef(false);

  const slideY = useRef(new Animated.Value(-OFF_SCREEN_Y)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const topInset = insets.top + 8;

  const runEnterAnimation = useCallback(() => {
    slideY.setValue(-OFF_SCREEN_Y);
    dragX.setValue(0);
    dragY.setValue(0);
    Animated.timing(slideY, {
      toValue: 0,
      duration: ENTER_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideY, dragX, dragY]);

  const runExitAnimation = useCallback(
    (onComplete?: () => void, exitOffsetX = 0) => {
      isExitingRef.current = true;
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: -OFF_SCREEN_Y,
          duration: EXIT_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dragX, {
          toValue: exitOffsetX,
          duration: EXIT_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dragY, {
          toValue: 0,
          duration: EXIT_DURATION_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        isExitingRef.current = false;
        if (finished) {
          slideY.setValue(-OFF_SCREEN_Y);
          dragX.setValue(0);
          dragY.setValue(0);
          onComplete?.();
        }
      });
    },
    [slideY, dragX, dragY],
  );

  const visibleOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!alert) return;

    setRendered(alert);
    if (visibleOrderIdRef.current !== alert.order.id) {
      visibleOrderIdRef.current = alert.order.id;
      runEnterAnimation();
    }
  }, [alert, runEnterAnimation]);

  useEffect(() => {
    if (alert || !visibleOrderIdRef.current || isExitingRef.current) return;

    visibleOrderIdRef.current = null;
    runExitAnimation(() => setRendered(null));
  }, [alert, runExitAnimation]);

  const finishUserDismiss = useCallback(
    (orderId: string) => {
      rejectJob(orderId);
      dismissActiveJobAlert(orderId);
    },
    [rejectJob, dismissActiveJobAlert],
  );

  const requestDismiss = useCallback(
    (orderId: string, swipeExitX = 0) => {
      if (accepting || isExitingRef.current) return;
      runExitAnimation(() => {
        setRendered(null);
        finishUserDismiss(orderId);
      }, swipeExitX);
    },
    [accepting, runExitAnimation, finishUserDismiss],
  );

  const panResponder = useMemo(() => {
    const orderId = rendered?.order.id;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !accepting &&
        !isExitingRef.current &&
        (Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10),
      onPanResponderMove: (_, gesture) => {
        const clampedY = Math.min(0, gesture.dy);
        dragX.setValue(gesture.dx);
        dragY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gesture) => {
        if (!orderId || accepting || isExitingRef.current) return;

        const swipedHorizontal =
          Math.abs(gesture.dx) > SWIPE_DISTANCE_THRESHOLD ||
          Math.abs(gesture.vx) > SWIPE_VELOCITY_THRESHOLD;
        const swipedUp =
          gesture.dy < -SWIPE_DISTANCE_THRESHOLD || gesture.vy < -SWIPE_VELOCITY_THRESHOLD;

        if (swipedHorizontal || swipedUp) {
          const exitX = swipedHorizontal ? (gesture.dx > 0 ? OFF_SCREEN_Y : -OFF_SCREEN_Y) : 0;
          requestDismiss(orderId, exitX);
          return;
        }

        Animated.parallel([
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    });
  }, [rendered?.order.id, accepting, dragX, dragY, requestDismiss]);

  if (!rendered) {
    return null;
  }

  const { order, radiusKm } = rendered;
  const orderId = order.id;
  const serviceName = order.serviceName?.trim() || "New job";
  const earnings = formatJobEarnings(order);
  const detailLines = buildNewJobAlertMessage(order, radiusKm).split("\n\n");

  const handleDismiss = () => requestDismiss(orderId);

  const handleAccept = async () => {
    if (accepting || isExitingRef.current) return;
    setAccepting(true);
    try {
      await acceptJob(orderId);
      setSelectedJobId(orderId);
      setSelectedRequestId(orderId);
      runExitAnimation(() => {
        setRendered(null);
        dismissActiveJobAlert(orderId);
        navigate("tJobDetail");
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not accept this job. Please try again.",
        "error",
      );
    } finally {
      setAccepting(false);
    }
  };

  const translateY = Animated.add(slideY, dragY);

  return (
    <View
      className="absolute left-0 right-0 z-[60] px-4"
      style={{ top: topInset }}
      pointerEvents="box-none"
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateY }, { translateX: dragX }],
        }}
        pointerEvents="auto"
      >
        <View
          className="rounded-2xl border-2 border-primary bg-white shadow-lg overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View className="bg-primary px-4 py-3 flex-row items-center gap-2">
            <Bell size={18} color="#F7FBF9" />
            <Text className="flex-1 text-primary-foreground font-black text-sm">
              New job within {radiusKm} km
            </Text>
            <TouchableOpacity
              onPress={handleDismiss}
              disabled={accepting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
            >
              <X size={16} color="#F7FBF9" />
            </TouchableOpacity>
          </View>

          <View className="px-4 py-3 gap-2">
            <Text className="font-black text-base text-foreground" numberOfLines={1}>
              {serviceName}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={14} color="#2E7D5B" />
              <Text className="text-xs text-muted-foreground flex-1" numberOfLines={2}>
                {order.address?.trim() || "Address not provided"}
              </Text>
            </View>
            <Text className="text-lg font-black text-primary">{earnings}</Text>
            {detailLines.slice(2).map((line) => (
              <Text key={line} className="text-[11px] text-muted-foreground">
                {line}
              </Text>
            ))}

            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                onPress={handleDismiss}
                disabled={accepting}
                className="flex-1 h-11 rounded-xl border-2 border-border items-center justify-center bg-muted/30"
              >
                <Text className="font-bold text-sm text-muted-foreground">Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void handleAccept()}
                disabled={accepting}
                className="flex-1 h-11 rounded-xl items-center justify-center bg-primary"
                style={{ opacity: accepting ? 0.7 : 1 }}
              >
                {accepting ? (
                  <ActivityIndicator color="#F7FBF9" />
                ) : (
                  <Text className="font-bold text-sm text-primary-foreground">Accept Job</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function IncomingJobAlertOverlay() {
  const { role, isAuthenticated, online, activeAlertJob } = useApp();

  if (!isAuthenticated || role !== "tasker" || !online) {
    return null;
  }

  return <IncomingJobAlertBanner alert={activeAlertJob} />;
}

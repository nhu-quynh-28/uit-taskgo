/**
 * Binary touch isolation — set EXPO_PUBLIC_TOUCH_ISOLATION_STEP (1–5) and restart Metro.
 * Each step cumulatively disables one more subsystem (no broad rewrites).
 */
const raw = process.env.EXPO_PUBLIC_TOUCH_ISOLATION_STEP;
const step = raw ? Math.max(0, Math.min(5, parseInt(raw, 10) || 0)) : 0;

export const touchIsolation = {
  step,
  active: step > 0,
  disableToast: step >= 1,
  disableScreenFade: step >= 2,
  disableGestureHandlerRootView: step >= 3,
  disableConnectionBanner: step >= 4,
  logResponders: step >= 5,
} as const;

if (__DEV__ && touchIsolation.active) {
  console.log(
    `[touch-isolation] step=${step} toast=${!touchIsolation.disableToast} fade=${!touchIsolation.disableScreenFade} GHRV=${!touchIsolation.disableGestureHandlerRootView} banner=${!touchIsolation.disableConnectionBanner} responderLog=${touchIsolation.logResponders}`,
  );
}

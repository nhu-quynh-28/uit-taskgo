import React, { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

/** Enable with EXPO_PUBLIC_TOUCH_DEBUG=1 in .env and restart Metro. */
export const TOUCH_FORENSICS_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_TOUCH_DEBUG === "1";

type TouchProbeProps = ViewProps & {
  id: string;
  color: string;
  children: ReactNode;
};

/**
 * Wraps a suspect layer: logs touch start and draws a colored border + tint in debug mode.
 * Does not capture touches (returns false from onStartShouldSetResponder).
 */
export function TouchProbe({ id, color, children, style, ...rest }: TouchProbeProps) {
  if (!TOUCH_FORENSICS_ENABLED) {
    return (
      <View style={style} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View
      {...rest}
      style={[
        style,
        {
          borderWidth: 2,
          borderColor: color,
          backgroundColor: `${color}22`,
        },
      ]}
      onTouchStart={(e) => {
        console.log(`[touch-forensics] touchStart id=${id}`, {
          x: e.nativeEvent.pageX,
          y: e.nativeEvent.pageY,
          pointerEvents: rest.pointerEvents ?? "auto",
        });
      }}
      onStartShouldSetResponder={() => {
        console.log(`[touch-forensics] responder-ask id=${id} (not capturing)`);
        return false;
      }}
    >
      {children}
    </View>
  );
}

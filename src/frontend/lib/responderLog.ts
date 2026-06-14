import type { ViewProps } from "react-native";

/** Step 5 only — logs responder negotiation on root views (does not capture). */
export function responderLogProps(id: string): Pick<ViewProps, "onTouchStart" | "onStartShouldSetResponder" | "onResponderGrant"> {
  return {
    onTouchStart: (e) => {
      console.log(`[touch-isolation] touchStart id=${id}`, {
        x: e.nativeEvent.pageX,
        y: e.nativeEvent.pageY,
      });
    },
    onStartShouldSetResponder: () => {
      console.log(`[touch-isolation] onStartShouldSetResponder id=${id} → false`);
      return false;
    },
    onResponderGrant: () => {
      console.log(`[touch-isolation] RESPONDER GRANTED id=${id}`);
    },
  };
}

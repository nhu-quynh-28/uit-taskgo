import React from "react";
import {
  Switch as RNSwitch,
  SwitchProps as RNSwitchProps,
} from "react-native";

type SwitchProps = RNSwitchProps & {
  className?: string;
};

export function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={{
        false: "#E5E7EB",
        true: "#3B82F6",
      }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#E5E7EB"
      {...props}
    />
  );
}
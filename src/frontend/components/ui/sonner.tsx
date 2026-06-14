import React from "react";
import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftWidth: 0,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        marginHorizontal: 16,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
      }}
      text2Style={{
        fontSize: 14,
        color: "#6B7280",
      }}
    />
  ),

  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftWidth: 0,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        marginHorizontal: 16,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
      }}
      text2Style={{
        fontSize: 14,
      }}
    />
  ),
};

export function Toaster() {
  return <Toast config={toastConfig} />;
}
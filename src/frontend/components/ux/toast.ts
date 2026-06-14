import Toast from "react-native-toast-message";

export type ToastType = "success" | "error" | "info";

export function showAppToast(message: string, type: ToastType = "info") {
  Toast.show({
    type,
    text1: message,
    position: "top",
    visibilityTime: type === "error" ? 4000 : 2800,
    topOffset: 56,
  });
}

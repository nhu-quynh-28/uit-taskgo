import * as React from "react";
import { View, Text } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { Minus } from "lucide-react-native";
import { cn } from '@/components/lib/utils';

const InputOTP = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof OtpInput> & { containerClassName?: string }
>(({ containerClassName, ...props }, ref) => (
  <View 
    ref={ref} 
    className={cn("flex-row items-center gap-2", containerClassName)}
  >
    <OtpInput
      {...props}
      theme={{
        containerStyle: { width: '100%', justifyContent: 'center' },
        pinCodeContainerStyle: { 
          width: 45, 
          height: 45, 
          borderRadius: 8, 
          borderWidth: 1, 
          borderColor: '#e2e8f0' 
        },
        pinCodeTextStyle: { fontSize: 20, color: '#0f172a' },
        focusedPinCodeContainerStyle: { borderColor: '#0ea5e9', borderWeight: 2 },
      }}
    />
  </View>
));
InputOTP.displayName = "InputOTP";

// Các component này trong bản Native thường được gộp vào theme của OtpInput
// Nhưng mình giữ lại khung để bạn không phải sửa code ở các màn hình sử dụng
const InputOTPGroup = ({ children, className }: any) => (
  <View className={cn("flex-row items-center", className)}>{children}</View>
);

const InputOTPSlot = ({ char, isActive, className }: any) => (
  <View
    className={cn(
      "h-10 w-10 items-center justify-center border border-input rounded-md",
      isActive && "border-2 border-ring",
      className
    )}
  >
    <Text className="text-lg font-medium text-foreground">{char}</Text>
  </View>
);

const InputOTPSeparator = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View>
>(({ ...props }, ref) => (
  <View ref={ref} className="mx-2" {...props}>
    <Minus size={20} className="text-muted-foreground" />
  </View>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
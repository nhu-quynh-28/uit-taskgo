import * as React from "react";
import { TextInput } from "react-native";

import { cn } from '@/components/lib/utils';

const Textarea = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  React.ComponentPropsWithoutRef<typeof TextInput>
>(({ className, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      // multiline={true} biến TextInput thành một Textarea
      multiline
      // textAlignVertical="top" đảm bảo chữ bắt đầu từ phía trên cùng (đặc biệt quan trọng trên Android)
      textAlignVertical="top"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm native:text-lg web:focus-visible:outline-none web:focus-visible:ring-1 web:focus-visible:ring-ring disabled:opacity-50",
        className
      )}
      placeholderTextColor="#a1a1aa"
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
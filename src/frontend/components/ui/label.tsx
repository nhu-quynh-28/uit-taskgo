import * as React from "react";
import * as LabelPrimitive from "@rn-primitives/label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from '@/components/lib/utils';

const labelVariants = cva(
  "text-sm font-medium leading-none web:peer-disabled:cursor-not-allowed web:peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Text>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Text> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root>
    <LabelPrimitive.Text
      ref={ref}
      className={cn(
        labelVariants(),
        "text-foreground", // Đảm bảo màu chữ hiển thị tốt trên cả Dark/Light mode
        className
      )}
      {...props}
    />
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

export { Label };
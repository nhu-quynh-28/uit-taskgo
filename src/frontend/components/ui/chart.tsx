import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { cn } from '@/components/lib/utils';

// Giữ nguyên định dạng ChartConfig để bạn không phải sửa code logic
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  }
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

const ChartContainer = React.forwardRef<
  View,
  React.ComponentPropsWithoutRef<typeof View> & {
    config: ChartConfig;
  }
>(({ className, children, config, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <View
        ref={ref}
        className={cn("flex aspect-video justify-center p-4", className)}
        {...props}
      >
        {/* Trên Mobile, chúng ta thường render biểu đồ từ thư viện khác ở đây */}
        {children}
      </View>
    </ChartContext.Provider>
  );
});

const ChartLegendContent = ({ className }: { className?: string }) => {
  const context = React.useContext(ChartContext);
  if (!context) return null;

  return (
    <View className={cn("flex-row flex-wrap justify-center gap-4 pt-4", className)}>
      {Object.entries(context.config).map(([key, item]) => (
        <View key={key} className="flex-row items-center gap-1.5">
          <View 
            className="h-3 w-3 rounded-sm" 
            style={{ backgroundColor: item.color }} 
          />
          <Text className="text-xs text-muted-foreground">{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

export { ChartContainer, ChartLegendContent, ChartContext };
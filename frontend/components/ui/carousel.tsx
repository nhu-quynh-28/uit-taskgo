import * as React from "react";
import { View, FlatList, Pressable, Dimensions } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { cn } from '@/components/lib/utils';
import { Button } from "@/components/ui/button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CarouselContextProps = {
  flatListRef: React.RefObject<FlatList>;
  orientation: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  activeIndex: number;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a <Carousel />");
  return context;
}

const Carousel = React.forwardRef<View, React.ComponentPropsWithoutRef<typeof View> & { orientation?: "horizontal" | "vertical" }>(
  ({ orientation = "horizontal", className, children, ...props }, ref) => {
    const flatListRef = React.useRef<FlatList>(null);
    const [activeIndex, setActiveIndex] = React.useState(0);

    const scrollPrev = () => {
      if (activeIndex > 0) {
        flatListRef.current?.scrollToIndex({ index: activeIndex - 1 });
      }
    };

    const scrollNext = () => {
      // Lưu ý: Cần biết tổng số item để chặn scrollNext, ở đây làm logic đơn giản
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    };

    return (
      <CarouselContext.Provider
        value={{
          flatListRef,
          orientation,
          scrollPrev,
          scrollNext,
          canScrollPrev: activeIndex > 0,
          canScrollNext: true, // Logic này phụ thuộc vào data length
          activeIndex,
        }}
      >
        <View ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </View>
      </CarouselContext.Provider>
    );
  }
);

const CarouselContent = React.forwardRef<View, React.ComponentPropsWithoutRef<typeof View> & { data: any[] }>(
  ({ className, data, ...props }, ref) => {
    const { flatListRef, orientation } = useCarousel();

    return (
      <View ref={ref} className={cn("overflow-hidden", className)}>
        <FlatList
          ref={flatListRef}
          data={data}
          horizontal={orientation === "horizontal"}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => item} // CarouselItem sẽ được truyền vào đây
          {...props}
        />
      </View>
    );
  }
);

const CarouselItem = React.forwardRef<View, React.ComponentPropsWithoutRef<typeof View>>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={{ width: SCREEN_WIDTH - 32 }} // Trừ padding 2 bên
        className={cn("shrink-0 grow-0", className)}
        {...props}
      />
    );
  }
);

const CarouselPrevious = ({ className, variant = "outline" }: any) => {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      variant={variant}
      className={cn("absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full", className)}
      disabled={!canScrollPrev}
      onPress={scrollPrev}
    >
      <ArrowLeft size={16} className="text-foreground" />
    </Button>
  );
};

const CarouselNext = ({ className, variant = "outline" }: any) => {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      variant={variant}
      className={cn("absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full", className)}
      disabled={!canScrollNext}
      onPress={scrollNext}
    >
      <ArrowRight size={16} className="text-foreground" />
    </Button>
  );
};

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
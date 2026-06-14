import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { EmptyState } from "@/components/ux/EmptyState";
import { ReviewCardSkeleton } from "@/components/ux/Skeleton";
import { showAppToast } from "@/components/ux/toast";
import { useApp } from "@/screens/AppContext";
import { Screen, TopBar, Card, PrimaryButton, Field, Chip } from "@/screens/ui";
import { Star, ImagePlus } from "lucide-react-native";
import { canReviewOrder } from "@/lib/adapters/reviewAdapter";

const tags = ["Punctual", "Friendly", "Professional", "Detailed", "Communicative", "Tidy"];

// --- SubmitReviewScreen ---
export function SubmitReviewScreen() {
  const {
    navigate,
    orders,
    activeOrderId,
    submitReview,
    reviewedOrderIds,
    catalogTaskers,
  } = useApp();

  const order =
    orders.find((o) => o.id === activeOrderId) ||
    orders.find((o) => canReviewOrder(o, reviewedOrderIds));

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order || !order.tasker) {
    return (
      <Screen className="bg-background items-center justify-center px-8">
        <Text className="text-muted-foreground text-center">
          Reviews are available after a completed, paid service with an assigned tasker.
        </Text>
        <PrimaryButton onClick={() => navigate("orders")} className="mt-4">
          View Orders
        </PrimaryButton>
      </Screen>
    );
  }

  if (!canReviewOrder(order, reviewedOrderIds)) {
    return (
      <Screen className="bg-background items-center justify-center px-8">
        <Text className="text-muted-foreground text-center">
          {reviewedOrderIds.has(order.id)
            ? "You have already reviewed this order."
            : "This order is not eligible for a review yet."}
        </Text>
        <PrimaryButton onClick={() => navigate("orders")} className="mt-4">
          View Orders
        </PrimaryButton>
      </Screen>
    );
  }

  const labels = ["Poor", "Fair", "Good", "Great", "Excellent"];

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({
        orderId: order.id,
        rating,
        comment: text.trim() || undefined,
      });
      showAppToast("Thanks for your feedback!", "success");
      navigate("reviews");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not submit review";
      setError(msg);
      showAppToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (t: string) => {
    setPicked(picked.includes(t) ? picked.filter((x) => x !== t) : [...picked, t]);
  };

  return (
    <Screen className="bg-background">
      <TopBar title="Leave a Review" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <Card className="p-4 flex-row items-center gap-3 mb-5">
          <Image source={{ uri: order.tasker.avatar }} className="w-12 h-12 rounded-2xl" />
          <View className="flex-1">
            <Text className="font-bold text-base">{order.tasker.name}</Text>
            <Text className="text-xs text-muted-foreground">{order.service.name}</Text>
          </View>
        </Card>

        <Card className="p-6 items-center mb-5">
          <Text className="text-sm text-muted-foreground mb-4">How was your experience?</Text>
          <View className="flex-row justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                <Star
                  size={36}
                  color={i <= rating ? "#fbbf24" : "#e5e7eb"}
                  fill={i <= rating ? "#fbbf24" : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text className="font-black text-primary text-lg uppercase tracking-wider">
            {labels[rating - 1]}
          </Text>
        </Card>

        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-tighter">
            Quality tags
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {tags.map((t) => (
              <Chip key={t} active={picked.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </Chip>
            ))}
          </View>
        </View>

        <Field label="Tell us more">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Share details about your experience…"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
            className="w-full min-h-[120px] p-4 rounded-2xl bg-muted text-sm text-foreground"
          />
        </Field>

        <View className="mt-4">
          <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase">
            Add a photo (optional)
          </Text>
          <View className="flex-row gap-3">
            {photo && <Image source={{ uri: photo }} className="w-20 h-20 rounded-2xl bg-muted" />}
            <TouchableOpacity
              onPress={() =>
                setPhoto("https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200")
              }
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center"
            >
              <ImagePlus size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <Text className="text-sm text-red-600 text-center mt-4">{error}</Text>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 inset-x-0 p-5 bg-white border-t border-border">
        <PrimaryButton onClick={submit} disabled={!rating || submitting}>
          {submitting ? "Submitting…" : "Submit Review"}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

// --- ReviewsScreen ---
export function ReviewsScreen() {
  const { reviews, navigate, reviewsLoading, loadMyReviews, catalogTaskers, orders } = useApp();

  return (
    <Screen className="bg-background">
      <View className="px-5 pt-4 pb-3 bg-white/90">
        <Text className="text-3xl font-black">My Reviews</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""} submitted
        </Text>
      </View>

      {reviewsLoading && reviews.length === 0 ? (
        <View className="px-5 pt-2">
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, flexGrow: 1 }}
          refreshing={reviewsLoading && reviews.length > 0}
          onRefresh={() => loadMyReviews().catch(() => showAppToast("Could not refresh reviews", "error"))}
          ListEmptyComponent={
            <EmptyState
              icon={<Star size={40} color="#d1d5db" />}
              title="No reviews yet"
              description="Complete a paid service to share feedback with your tasker."
              actionLabel="View Orders"
              onAction={() => navigate("orders")}
            />
          }
          renderItem={({ item: r }) => {
            const orderMatch = orders.find((o) => o.taskerId === r.taskerId);
            const t =
              catalogTaskers.find(
                (tasker) => tasker.id === r.taskerId || tasker.userId === r.taskerId,
              ) ?? orderMatch?.tasker;
            return (
              <Card className="p-4 mb-4">
                <View className="flex-row items-center gap-3 mb-3">
                  {t && <Image source={{ uri: t.avatar }} className="w-10 h-10 rounded-full" />}
                  <View className="flex-1">
                    <Text className="font-bold text-sm text-gray-800">{t?.name || "Tasker"}</Text>
                    <Text className="text-[10px] text-muted-foreground">
                      {r.serviceName} · {r.date}
                    </Text>
                  </View>
                  <View className="flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={12}
                        color={i <= r.rating ? "#fbbf24" : "#e5e7eb"}
                        fill={i <= r.rating ? "#fbbf24" : "transparent"}
                      />
                    ))}
                  </View>
                </View>

                {r.text ? (
                  <Text className="text-sm text-gray-600 leading-5 mb-3">{r.text}</Text>
                ) : null}

                {r.tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-1">
                    {r.tags.map((tag) => (
                      <View key={tag} className="px-2 py-0.5 rounded-full bg-emerald-50">
                        <Text className="text-[9px] font-bold text-emerald-700">{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}


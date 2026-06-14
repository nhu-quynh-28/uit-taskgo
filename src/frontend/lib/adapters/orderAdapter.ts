import { Sparkles } from "lucide-react-native";
import type { OrderDTO, UserDTO } from "../api/types";
import type { Order } from "@/screens/AppContext";
import type { Service, Tasker } from "@/screens/data";
import { findCatalogServiceByName } from "../catalog/registry";
import { localDateFromParts } from "@/lib/scheduling/localDateTime";
import { resolveOrderPricing } from "@/lib/pricing/orderPricing";
import { apiStatusToLabel, apiStatusToTab } from "./statusMaps";

function resolveService(serviceName: string): Service {
  const found = findCatalogServiceByName(serviceName);
  if (found) return found;

  return {
    id: `svc-${serviceName}`,
    name: serviceName,
    icon: Sparkles,
    color: "bg-emerald-50",
    price: 0,
    duration: "—",
    description: "",
    includes: [],
    rating: 4.8,
    reviews: 0,
  };
}

export function userDtoToTaskerStub(dto: UserDTO): Tasker {
  return {
    id: dto.id,
    userId: dto.id,
    name: dto.name,
    avatar: dto.avatar ?? "https://i.pravatar.cc/200?img=33",
    rating: dto.averageRating ?? 4.9,
    jobs: dto.totalReviews ?? 0,
    distanceKm: 0,
    hourly: 0,
    badges: dto.verificationStatus === "verified" ? ["Verified"] : [],
    bio: "",
    verified: dto.verificationStatus === "verified",
    online: dto.online ?? false,
    portfolio: [],
    availability: [],
  };
}

function parseScheduledParts(scheduledAt: string): { date: string; time: string } {
  try {
    const d = new Date(scheduledAt);
    if (Number.isNaN(d.getTime())) {
      return { date: scheduledAt, time: "" };
    }
    return {
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: scheduledAt, time: "" };
  }
}

export function orderDtoToOrder(dto: OrderDTO, tasker?: Tasker | null): Order {
  const { date, time } = parseScheduledParts(dto.scheduledAt);
  const tabStatus = apiStatusToTab(dto.status);

  const pricing = resolveOrderPricing({
    subtotal: Number(dto.subtotal),
    bookingType: dto.bookingType,
    pricing: dto.pricing ?? undefined,
  });

  return {
    id: dto.id,
    service: resolveService(dto.serviceName),
    tasker: tasker ?? undefined,
    date,
    time,
    address: dto.address,
    notes: dto.notes,
    payment:
      dto.paymentStatus === "paid"
        ? "Paid"
        : dto.paymentStatus === "processing"
          ? "Processing"
          : "Unpaid",
    status: tabStatus,
    total: pricing.total,
    apiStatus: dto.status,
    paymentStatus: dto.paymentStatus,
    statusLabel: apiStatusToLabel(dto.status, dto.paymentStatus),
    taskerId: dto.taskerId,
    customerId: dto.customerId,
    scheduledAt: dto.scheduledAt,
    updatedAt: dto.updatedAt,
    acceptedAt: dto.acceptedAt,
    subtotal: pricing.subtotal,
    bookingType: dto.bookingType,
    pricing,
    location: dto.location,
  };
}

export function buildScheduledAtIso(dateIso: string, timeSlot: string): string {
  const parsed = timeSlot.split(":").map((n) => parseInt(n, 10));
  const hours = parsed[0];
  const minutes = parsed[1];
  return localDateFromParts(
    dateIso,
    Number.isNaN(hours) ? 0 : hours,
    Number.isNaN(minutes) ? 0 : minutes,
  ).toISOString();
}

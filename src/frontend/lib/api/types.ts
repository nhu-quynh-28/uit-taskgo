/** Backend REST envelope (locked contract) */
export type ApiMeta = {
  requestId: string;
  timestamp: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  meta?: ApiMeta;
};

/** Auth responses */
export type UserDTO = {
  id: string;
  email: string;
  role: "admin" | "customer" | "tasker";
  name: string;
  phone?: string;
  avatar?: string | null;
  online?: boolean;
  location?: { lat: number; lng: number };
  savedAddresses?: {
    id: string;
    label: string;
    houseNumber?: string;
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    fullAddress?: string;
    line?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
    state?: string;
    postalCode?: string;
  }[];
  averageRating?: number;
  totalReviews?: number;
  accountStatus?: "active" | "blocked";
  verificationStatus?: "pending" | "verified" | "rejected";
  kyc?: {
    fullName?: string;
    dob?: string;
    address?: string;
    phone?: string;
    cccdFront?: string;
    cccdBack?: string;
    submittedAt?: string;
  } | null;
  /** Tasker catalog service IDs for job notification routing */
  services?: string[];
  bio?: string;
  createdAt?: string;
};

export type SubmitKycInput = {
  fullName: string;
  dob: string;
  address: string;
  phone: string;
  cccdFront: string;
  cccdBack: string;
};

export type AuthSession = {
  user: UserDTO;
  token: string;
};

/** Payment failure payload on HTTP 402 */
export type PaymentFailedData = {
  order: OrderDTO;
  trace?: PaymentTraceDTO;
  retryable?: boolean;
};

export type OrderPricingDTO = {
  subtotal: number;
  schedulingFee: number;
  platformFee: number;
  total: number;
};

export type OrderDTO = {
  id: string;
  customerId: string;
  taskerId: string | null;
  serviceName: string;
  address: string;
  scheduledAt: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  bookingType?: "instant" | "scheduled";
  serviceId?: string | null;
  estimatedDurationMinutes?: number | null;
  notes?: string;
  subtotal: number;
  pricing?: OrderPricingDTO | null;
  status: string;
  paymentStatus: string;
  location?: { lat: number; lng: number };
  acceptedAt?: string;
  completedAt?: string;
  lastPaymentTraceId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentTraceDTO = {
  id: string;
  orderId: string;
  provider?: string;
  status?: string;
  amount?: number;
  failureReason?: string;
  createdAt?: string;
  completedAt?: string;
  attempts?: unknown[];
};

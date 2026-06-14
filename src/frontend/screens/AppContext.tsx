import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { fetchMeRequest, loginRequest, registerRequest } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import type { UserDTO } from "@/lib/api/types";
import { dtoRoleToAppRole, userDtoToProfileUser } from "@/lib/auth/mapUser";
import {
  getPostAuthScreen,
  isUserBlocked,
  type PostAuthScreen,
} from "@/lib/auth/navigation";
import { listServicesRequest } from "@/lib/api/services";
import { listTaskersRequest } from "@/lib/api/taskers";
import { getMyEarningsRequest } from "@/lib/api/earnings";
import {
  getCatalogCategories,
  isMarketplaceTasker,
  mapApiServices,
  userDtoToCatalogTasker,
  type CatalogService,
} from "@/lib/adapters/catalogAdapter";
import {
  earningsSummaryToTransactions,
  earningsSummaryToWeeklyChart,
} from "@/lib/adapters/earningsAdapter";
import { setCatalogServices as syncCatalogRegistry } from "@/lib/catalog/registry";
import { resolveCategoryBookingTarget } from "@/lib/catalog/categoryBooking";
import { getCategoryLabel, HOME_CATEGORY_GRID } from "@/lib/constants/categories";
import type { Tasker } from "./data";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/storage/token";
import {
  createOrderRequest,
  listOrdersRequest,
  getOrderRequest,
  publishOrderRequest,
  cancelOrderRequest,
  acceptOrderRequest,
  arriveOrderRequest,
  startOrderRequest,
  completeOrderRequest,
  type CreateOrderInput,
} from "@/lib/api/orders";
import { getUserByIdRequest, patchMeRequest } from "@/lib/api/users";
import {
  buildProfileAddressUpdate,
  ensureOneDefault,
  syncAddressesFromUser,
} from "@/lib/profile/addresses";
import { orderDtoToOrder, userDtoToTaskerStub } from "@/lib/adapters/orderAdapter";
import {
  type CustomerStub,
  type TaskerJob,
  isTaskerIncomingOrder,
  isTaskerOwnedOrder,
  orderToTaskerJob,
  orderToJobRequest,
  fallbackCustomerStub,
  userDtoToCustomerStub,
} from "@/lib/adapters/taskerOrderAdapter";
import { isConflictError, isInvalidStateTransitionError } from "@/lib/api/errors";
import { createIdempotencyKey } from "@/lib/idempotency";
import {
  listChatMessagesRequest,
  listChatThreadsRequest,
  markChatThreadReadRequest,
  openChatThreadRequest,
  sendChatMessageRequest,
  type ChatMessageDTO,
  type ChatThreadDTO,
} from "@/lib/api/chat";
import {
  messageDtoToUi,
  threadDtoToListItem,
  type ChatMessage,
  type ChatThread,
} from "@/lib/adapters/chatAdapter";
import { attachChatSync, joinChatThreadRoom } from "@/lib/realtime/chatSync";
import { attachOrderSync, shouldApplyOrderUpdate } from "@/lib/realtime/orderSync";
import { attachReviewSync } from "@/lib/realtime/reviewSync";
import {
  attachTaskerPresenceSync,
  emitTaskerToggleOnline,
} from "@/lib/realtime/taskerPresenceSync";
import {
  attachTaskerJobAlertSync,
  clearJobAlertDedupe,
  presentNewJobAvailableAlert,
  type ActiveJobAlert,
} from "@/lib/realtime/taskerJobAlert";
import {
  createReviewRequest,
  listMyReviewsRequest,
  listTaskerReviewsRequest,
} from "@/lib/api/reviews";
import {
  canReviewOrder,
  mapTaskerReviewsResponse,
  reviewDtoToCustomerReview,
  type TaskerReviewsView,
} from "@/lib/adapters/reviewAdapter";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket/client";
import { showAppToast } from "@/components/ux/toast";
import type { OrderDTO } from "@/lib/api/types";
import { Service } from "./data";
import {
  ActiveJob,
  initialTaskerServices,
  JobRequest,
  Transaction,
} from "./taskerData";

const DEFAULT_TASKER_LOCATION = { lat: 37.7749, lng: -122.4194 };

export type Role = "customer" | "tasker";

export type SocketStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export type Screen =
  | "splash" | "onboarding" | "login" | "register" | "forgot"
  | "home" | "category" | "search" | "serviceDetail"
  | "taskerList" | "taskerProfile"
  | "bookingForm" | "bookingConfirm" | "orderMatching" | "payment" | "paymentSuccess" | "receipt"
  | "orders" | "orderDetail" | "tracking" | "completed"
  | "chatList" | "chat"
  | "reviews" | "submitReview"
  | "profile" | "editProfile" | "addresses" | "paymentMethods" | "settings" | "help"
  // Tasker screens
  | "tRegister" | "tDocuments" | "tPending" | "tRejected"
  | "tDashboard" | "tJobs" | "tEarnings" | "tProfile"
  | "tIncoming" | "tNearby" | "tOrderRequest" | "tJobDetail" | "tJobStatus"
  | "tNavigation" | "tCustomerInfo" | "tProgress"
  | "tEarningDetail" | "tWithdraw" | "tReviews" | "tEditServices";

export type Order = {
  id: string;
  service: Service;
  tasker?: Tasker;
  date: string;
  time: string;
  address: string;
  notes?: string;
  payment: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  total: number;
  apiStatus?: string;
  paymentStatus?: string;
  statusLabel?: string;
  taskerId?: string | null;
  customerId?: string;
  scheduledAt?: string;
  updatedAt?: string;
  acceptedAt?: string;
  subtotal?: number;
  bookingType?: "instant" | "scheduled";
  pricing?: {
    subtotal: number;
    schedulingFee: number;
    platformFee: number;
    total: number;
  };
  location?: { lat: number; lng: number };
};

export type Review = {
  id: string;
  orderId: string;
  taskerId: string;
  serviceName: string;
  rating: number;
  text: string;
  tags: string[];
  date: string;
};

type Booking = {
  service?: Service;
  bookingType?: "instant" | "scheduled";
  preferredTasker?: Tasker;
  scheduledDateIso?: string;
  selectedAddressId?: string;
  date?: string;
  time?: string;
  address?: string;
  notes?: string;
  payment?: string;
  promo?: string;
  total?: number;
};

export type TaskerProfile = {
  name: string;
  avatar: string;
  bio: string;
  category: string;
  skills: string[];
  experience: string;
  area: string;
  rating: number;
  totalJobs: number;
  completionRate: number;
  phone?: string;
  dob?: string;
  address?: string;
  selectedServiceIds: string[];
};

export type TaskerKycPayload = {
  fullName: string;
  dob: string;
  address: string;
  phone: string;
  cccdFront: { previewUri: string; persistUri: string };
  cccdBack: { previewUri: string; persistUri: string };
  submittedAt: string;
};

export type Documents = {
  status: "draft" | "pending" | "verified";
  submittedForReview: boolean;
  kyc: TaskerKycPayload | null;
};

export type User = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
};

export type Address = {
  id: string;
  label: string;
  houseNumber?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  fullAddress: string;
  line: string;
  latitude?: number;
  longitude?: number;
  default: boolean;
};

type Ctx = {
  screen: Screen;
  navigate: (s: Screen) => void;
  switchTab: (s: Screen) => void;
  back: () => void;
  role: Role;
  setRole: (r: Role) => void;
  authUser: UserDTO | null;
  authToken: string | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  socketStatus: SocketStatus;
  retrySocketConnection: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  login: (email: string, password: string) => Promise<UserDTO>;
  resolvePostAuthScreen: (dto: UserDTO) => PostAuthScreen;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
  }) => Promise<UserDTO>;
  logout: () => Promise<void>;
  selectedCategory?: string;
  setSelectedCategory: (c?: string) => void;
  startCategoryBooking: (categoryId: string, servicesPool?: CatalogService[]) => void;
  selectedService?: Service;
  setSelectedService: (s?: Service) => void;
  selectedTasker?: Tasker;
  setSelectedTasker: (t?: Tasker) => void;
  booking: Booking;
  setBooking: React.Dispatch<React.SetStateAction<Booking>>;
  orders: Order[];
  ordersLoading: boolean;
  addOrder: (o: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  loadOrders: () => Promise<void>;
  refreshOrder: (orderId: string) => Promise<Order | null>;
  createAndPublishOrder: (input: CreateOrderInput) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<void>;
  activeOrderId?: string;
  setActiveOrderId: (id?: string) => void;
  reviews: Review[];
  reviewedOrderIds: Set<string>;
  reviewsLoading: boolean;
  loadMyReviews: () => Promise<void>;
  submitReview: (input: { orderId: string; rating: number; comment?: string }) => Promise<void>;
  canReviewOrder: (orderId: string) => boolean;
  taskerReviewsCache: Record<string, TaskerReviewsView>;
  taskerReviewsLoading: boolean;
  loadTaskerReviews: (taskerId: string) => Promise<TaskerReviewsView | null>;
  setActiveTaskerProfileId: (taskerId?: string) => void;
  chatThreads: ChatThread[];
  messagesByThreadId: Record<string, ChatMessage[]>;
  chatLoading: boolean;
  loadChatThreads: () => Promise<void>;
  loadChatMessages: (threadId: string) => Promise<void>;
  openChatForOrder: (orderId: string) => Promise<void>;
  sendChatMessage: (threadId: string, text: string) => Promise<void>;
  markChatThreadRead: (threadId: string) => Promise<void>;
  activeChatId?: string;
  setActiveChatId: (id?: string) => void;
  user: User;
  setUser: (u: User) => void;
  syncProfileFromDto: (dto: UserDTO) => void;
  addresses: Address[];
  setAddresses: (a: Address[]) => void;
  saveAddresses: (a: Address[]) => Promise<void>;
  notif: boolean; setNotif: (b: boolean) => void;
  darkMode: boolean; setDarkMode: (b: boolean) => void;
  language: string; setLanguage: (s: string) => void;
  online: boolean; setOnline: (b: boolean) => void;
  taskerProfile: TaskerProfile; setTaskerProfile: (p: TaskerProfile) => void;
  documents: Documents; setDocuments: (d: Documents) => void;
  incoming: JobRequest[];
  activeAlertJob: ActiveJobAlert | null;
  dismissActiveJobAlert: (orderId?: string) => void;
  taskerJobs: TaskerJob[];
  activeJobs: ActiveJob[];
  acceptJob: (orderId: string) => Promise<void>;
  rejectJob: (orderId: string) => void;
  advanceJob: (
    orderId: string,
    action: "arrive" | "start" | "complete",
  ) => Promise<Order | null>;
  acceptJobError: string | null;
  clearAcceptJobError: () => void;
  selectedJobId?: string; setSelectedJobId: (id?: string) => void;
  selectedRequestId?: string; setSelectedRequestId: (id?: string) => void;
  transactions: Transaction[];
  taskerServices: typeof initialTaskerServices;
  setTaskerServices: (s: typeof initialTaskerServices) => void;
  catalogServices: CatalogService[];
  catalogTaskers: Tasker[];
  catalogCategories: { id: string; name: string; icon: typeof HOME_CATEGORY_GRID[number]["icon"]; color: string }[];
  catalogLoading: boolean;
  catalogError: string | null;
  reloadCatalog: () => Promise<void>;
  earningsLoading: boolean;
  weeklyEarnings: number[];
  reloadEarnings: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // --- ĐƯA TẤT CẢ KHAI BÁO USE-REF LÊN ĐẦU COMPONENT ĐỂ TRÁNH LỖI HOISTING ---
  const navigateRef = useRef<(s: Screen) => void>(() => {});
  const acceptJobRef = useRef<(orderId: string) => Promise<void>>(async () => {});
  const rejectJobRef = useRef<(orderId: string) => void>(() => {});
  const taskerCacheRef = useRef<Map<string, Tasker>>(new Map());
  const activeTaskerProfileIdRef = useRef<string | undefined>(undefined);
  const activeChatIdRef = useRef<string | undefined>(undefined);
  const onlineRef = useRef(true);
  const appIsActiveRef = useRef(true);
  const documentsRef = useRef<Documents>({ status: "draft", submittedForReview: false, kyc: null });
  const customerCacheRef = useRef<Map<string, CustomerStub>>(new Map());
  const orderVersionRef = useRef<Map<string, string>>(new Map());
  const ordersRef = useRef<Order[]>([]);
  const realtimeTeardownRef = useRef<(() => void) | null>(null);

  // --- CÁC STATE GIỮ NGUYÊN VỊ TRÍ ---
  const [screen, setScreen] = useState<Screen>("splash");
  const [stack, setStack] = useState<Screen[]>([]);
  const [role, setRole] = useState<Role>("customer");
  const [authUser, setAuthUser] = useState<UserDTO | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("idle");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [selectedTasker, setSelectedTasker] = useState<Tasker | undefined>();
  const [booking, setBooking] = useState<Booking>({});
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [taskerReviewsCache, setTaskerReviewsCache] = useState<Record<string, TaskerReviewsView>>({});
  const [taskerReviewsLoading, setTaskerReviewsLoading] = useState(false);
  
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [messagesByThreadId, setMessagesByThreadId] = useState<Record<string, ChatMessage[]>>({});
  const [chatLoading, setChatLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | undefined>();

  // --- CÁC PHƯƠNG THỨC ĐIỀU HƯỚNG ---
  const switchTab = useCallback((s: Screen) => {
    setScreen((current) => (current === s ? current : s));
  }, []);

  const navigate = (s: Screen) => {
    setStack((prev) => [...prev, screen]);
    setScreen(s);
  };

  const back = () => {
    setStack((prev) => {
      const next = [...prev];
      const last = next.pop();
      if (last) {
        setScreen(last);
        return next;
      }
      setScreen(role === "tasker" ? "tDashboard" : "home");
      return next;
    });
  };
  
  const [user, setUser] = useState({
    name: "Alex Morgan", email: "alex@taskgo.app", phone: "+1 555 0142",
    avatar: "https://i.pravatar.cc/200?img=68",
  });
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  const [notif, setNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");

  // Tasker state
  const [online, setOnline] = useState(true);
  
  useEffect(() => {
    onlineRef.current = online;
  }, [online]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appIsActiveRef.current = next === "active";
    });
    return () => sub.remove();
  }, []);

  const [taskerProfile, setTaskerProfile] = useState<TaskerProfile>({
    name: "Jordan Reeves",
    avatar: "https://i.pravatar.cc/200?img=33",
    bio: "Reliable home services pro. 5+ years cleaning and handyman experience.",
    category: "Cleaning",
    skills: ["Deep Cleaning", "Office Cleaning", "Window Cleaning"],
    experience: "3-5 years",
    area: "Phu Nhuan, Ho Chi Minh City · 10 km",
    rating: 4.92,
    totalJobs: 184,
    completionRate: 98,
    phone: "",
    dob: "",
    address: "",
    selectedServiceIds: ["ts1", "ts2"],
  });
  
  const [documents, setDocuments] = useState<Documents>({
    status: "draft",
    submittedForReview: false,
    kyc: null,
  });

  // Đồng bộ hóa documentsRef kế thừa từ state ban đầu
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  const resolvePostAuthScreen = useCallback(
    (dto: UserDTO) =>
      getPostAuthScreen(dto, { kycSubmitted: documentsRef.current.submittedForReview }),
    [],
  );
  
  const [dismissedIncomingIds, setDismissedIncomingIds] = useState<Set<string>>(new Set());
  const [acceptJobError, setAcceptJobError] = useState<string | null>(null);
  const [activeAlertJob, setActiveAlertJob] = useState<ActiveJobAlert | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [catalogServices, setCatalogServicesState] = useState<CatalogService[]>([]);
  const [catalogTaskers, setCatalogTaskers] = useState<Tasker[]>([]);
  const [catalogCategories, setCatalogCategories] = useState(() =>
    HOME_CATEGORY_GRID.map((c) => ({
      id: c.id,
      name: c.label,
      icon: c.icon,
      color: c.color,
    })),
  );
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [taskerServices, setTaskerServices] = useState(initialTaskerServices);

  const applySession = useCallback((sessionUser: UserDTO, token: string) => {
    const appRole = dtoRoleToAppRole(sessionUser);
    setAuthUser(sessionUser);
    setAuthToken(token);
    setIsAuthenticated(true);
    setRole(appRole);
    setUser(userDtoToProfileUser(sessionUser));
    setTaskerProfile((prev) => ({
      ...prev,
      name: sessionUser.name,
      avatar: sessionUser.avatar ?? prev.avatar,
    }));
    if (sessionUser.role === "tasker") {
      setOnline(sessionUser.online ?? false);
      setTaskerProfile((prev) => ({
        ...prev,
        name: sessionUser.kyc?.fullName?.trim() || sessionUser.name,
        phone: sessionUser.phone ?? prev.phone,
        dob: sessionUser.kyc?.dob ?? prev.dob,
        address: sessionUser.kyc?.address ?? prev.address,
        selectedServiceIds: sessionUser.services ?? prev.selectedServiceIds,
        bio: sessionUser.bio ?? prev.bio,
        rating: sessionUser.averageRating ?? prev.rating,
        totalJobs: sessionUser.totalReviews ?? prev.totalJobs,
      }));
      if (sessionUser.kyc) {
        setDocuments((prev) => ({
          ...prev,
          kyc: {
            fullName: sessionUser.kyc!.fullName ?? sessionUser.name,
            dob: sessionUser.kyc!.dob ?? "",
            address: sessionUser.kyc!.address ?? "",
            phone: sessionUser.kyc!.phone ?? sessionUser.phone ?? "",
            cccdFront: {
              previewUri: sessionUser.kyc!.cccdFront ?? "",
              persistUri: sessionUser.kyc!.cccdFront ?? "",
            },
            cccdBack: {
              previewUri: sessionUser.kyc!.cccdBack ?? "",
              persistUri: sessionUser.kyc!.cccdBack ?? "",
            },
            submittedAt: sessionUser.kyc!.submittedAt ?? new Date().toISOString(),
          },
          submittedForReview: true,
          status:
            sessionUser.verificationStatus === "verified"
              ? "verified"
              : sessionUser.verificationStatus === "rejected"
                ? "draft"
                : "pending",
        }));
      }
      const verification = sessionUser.verificationStatus ?? "pending";
      setDocuments((prev) => {
        const next: Documents = {
          ...prev,
          status:
            verification === "verified"
              ? "verified"
              : verification === "rejected"
                ? "draft"
                : prev.submittedForReview
                  ? "pending"
                  : "draft",
        };
        documentsRef.current = next;
        return next;
      });
    }
    setAddresses(syncAddressesFromUser(sessionUser));
  }, []);

  const saveAddresses = useCallback(async (next: Address[]) => {
    const normalized = ensureOneDefault(next);
    const updated = await patchMeRequest(buildProfileAddressUpdate(normalized));
    setAuthUser(updated);
    setAddresses(syncAddressesFromUser(updated));
  }, []);

  const syncProfileFromDto = useCallback((dto: UserDTO) => {
    setAuthUser(dto);
    setUser(userDtoToProfileUser(dto));
    setTaskerProfile((prev) => ({
      ...prev,
      name: dto.kyc?.fullName?.trim() || dto.name,
      avatar: dto.avatar ?? prev.avatar,
      phone: dto.phone ?? prev.phone,
      dob: dto.kyc?.dob ?? prev.dob,
      address: dto.kyc?.address ?? prev.address,
      selectedServiceIds: dto.services ?? prev.selectedServiceIds,
      bio: dto.bio ?? prev.bio,
    }));
    if (dto.kyc && dto.role === "tasker") {
      setDocuments((prev) => ({
        ...prev,
        kyc: prev.kyc
          ? {
              ...prev.kyc,
              dob: dto.kyc?.dob ?? prev.kyc.dob,
              address: dto.kyc?.address ?? prev.kyc.address,
              phone: dto.kyc?.phone ?? dto.phone ?? prev.kyc.phone,
            }
          : prev.kyc,
      }));
    }
  }, []);

  const startCategoryBooking = useCallback(
    (categoryId: string, servicesPool?: CatalogService[]) => {
      const pool =
        servicesPool && servicesPool.length > 0 ? servicesPool : catalogServices;
      setSelectedCategory(categoryId);
      setSelectedTasker(undefined);
      const target = resolveCategoryBookingTarget(pool, categoryId);

      if (target.kind === "serviceDetail") {
        setSelectedService(target.service);
        setBooking((prev) => ({ ...prev, service: target.service }));
        navigate("serviceDetail");
        return;
      }

      if (target.services.length > 0) {
        navigate("category");
        return;
      }

      showAppToast(
        `No ${getCategoryLabel(categoryId)} services available yet. Try another category.`,
        "info",
      );
      navigate("category");
    },
    [catalogServices, navigate, setBooking],
  );

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const [apiServices, apiTaskers] = await Promise.all([
        listServicesRequest(),
        listTaskersRequest(),
      ]);
      const mapped = mapApiServices(apiServices);
      setCatalogServicesState(mapped);
      syncCatalogRegistry(mapped);
      setCatalogCategories(getCatalogCategories(mapped));
      const marketplace = apiTaskers
        .filter(isMarketplaceTasker)
        .map((u, i) => userDtoToCatalogTasker(u, i));
      setCatalogTaskers(marketplace);
    } catch {
      setCatalogError("Could not load marketplace catalog");
      showAppToast("Could not load services", "error");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadEarnings = useCallback(async () => {
    if (!authUser?.id || role !== "tasker") return;
    setEarningsLoading(true);
    try {
      const summary = await getMyEarningsRequest();
      setTransactions(earningsSummaryToTransactions(summary));
      setWeeklyEarnings(earningsSummaryToWeeklyChart(summary));
      setTaskerProfile((prev) => ({
        ...prev,
        totalJobs: summary.totalJobs,
      }));
    } catch {
      showAppToast("Could not load earnings", "error");
    } finally {
      setEarningsLoading(false);
    }
  }, [authUser?.id, role]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      showAppToast(message, type);
    },
    [],
  );

  const retrySocketConnection = useCallback(async () => {
    if (!isAuthenticated) return;
    setSocketStatus("connecting");
    try {
      await connectSocket({ reconnected: true });
    } catch {
      setSocketStatus("disconnected");
      showAppToast("Could not connect to live updates", "error");
    }
  }, [isAuthenticated]);

  const logout = useCallback(async () => {
    realtimeTeardownRef.current?.();
    realtimeTeardownRef.current = null;
    disconnectSocket();
    setSocketStatus("idle");
    await clearAccessToken();
    setAuthUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setOrders([]);
    taskerCacheRef.current.clear();
    customerCacheRef.current.clear();
    orderVersionRef.current.clear();
    setDismissedIncomingIds(new Set());
    setAcceptJobError(null);
    setActiveAlertJob(null);
    setChatThreads([]);
    setMessagesByThreadId({});
    setActiveChatId(undefined);
    setReviews([]);
    setReviewedOrderIds(new Set());
    setTaskerReviewsCache({});
    activeTaskerProfileIdRef.current = undefined;
    setCatalogServicesState([]);
    syncCatalogRegistry([]);
    setCatalogTaskers([]);
    setTransactions([]);
    setWeeklyEarnings([0, 0, 0, 0, 0, 0, 0]);
    setAddresses([]);
    setDocuments({ status: "draft", submittedForReview: false, kyc: null });
    setStack([]);
    setScreen("login");
  }, []);

  const logoutRef = useRef(logout);

  useLayoutEffect(() => {
    navigateRef.current = navigate;
    activeChatIdRef.current = activeChatId;
    ordersRef.current = orders;
    logoutRef.current = logout;
    loadMyReviewsRef.current = loadMyReviews;
  });

  useEffect(() => {
    setUnauthorizedHandler(() => logoutRef.current());

    let cancelled = false;

    (async () => {
      try {
        const stored = await getAccessToken();
        if (stored) {
          const me = await fetchMeRequest();
          if (!cancelled) {
            if (isUserBlocked(me)) {
              await clearAccessToken();
              setAuthUser(null);
              setAuthToken(null);
              setIsAuthenticated(false);
              setScreen("login");
            } else {
              applySession(me, stored);
              setScreen(
                getPostAuthScreen(me, {
                  kycSubmitted: documentsRef.current.submittedForReview,
                }),
              );
            }
          }
        }
      } catch {
        await clearAccessToken();
        if (!cancelled) {
          setAuthUser(null);
          setAuthToken(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string): Promise<UserDTO> => {
      const session = await loginRequest({ email, password });
      if (isUserBlocked(session.user)) {
        throw new Error("Your account has been blocked. Please contact support.");
      }
      await setAccessToken(session.token);
      applySession(session.user, session.token);
      return session.user;
    },
    [applySession],
  );

  const hydrateOrderFromDto = useCallback(async (dto: OrderDTO): Promise<Order> => {
    let tasker: Tasker | undefined;
    if (dto.taskerId) {
      const cached = taskerCacheRef.current.get(dto.taskerId);
      if (cached) {
        tasker = cached;
      } else {
        try {
          const u = await getUserByIdRequest(dto.taskerId);
          const stub = userDtoToTaskerStub(u);
          tasker = stub;
          taskerCacheRef.current.set(dto.taskerId, stub);
        } catch {
          /* profile optional */
        }
      }
    }
    return orderDtoToOrder(dto, tasker);
  }, []);

  const upsertOrderFromDto = useCallback(
    async (dto: OrderDTO) => {
      const order = await hydrateOrderFromDto(dto);
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === order.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = order;
          return next;
        }
        return [order, ...prev];
      });
      return order;
    },
    [hydrateOrderFromDto],
  );

  const hydrateCustomer = useCallback(async (customerId: string, orderAddress: string, notes?: string) => {
    const cached = customerCacheRef.current.get(customerId);
    if (cached) return cached;
    try {
      const u = await getUserByIdRequest(customerId);
      const stub = userDtoToCustomerStub(u, orderAddress, notes);
      customerCacheRef.current.set(customerId, stub);
      return stub;
    } catch {
      const fallback: CustomerStub = {
        id: customerId,
        name: "Customer",
        avatar: "https://i.pravatar.cc/120?img=12",
        phone: "",
        address: orderAddress,
        notes,
      };
      customerCacheRef.current.set(customerId, fallback);
      return fallback;
    }
  }, []);

  const mergeOrderFromDto = useCallback(
    async (dto: OrderDTO, options?: { force?: boolean }) => {
      if (!shouldApplyOrderUpdate(dto, orderVersionRef, options?.force)) {
        return null;
      }
      if (dto.customerId && role === "tasker") {
        await hydrateCustomer(dto.customerId, dto.address, dto.notes);
      }
      return upsertOrderFromDto(dto);
    },
    [upsertOrderFromDto, hydrateCustomer, role],
  );

  const dismissActiveJobAlert = useCallback((orderId?: string) => {
    setActiveAlertJob((current) => {
      if (!current) return null;
      if (orderId && current.order.id !== orderId) return current;
      clearJobAlertDedupe(current.order.id);
      return null;
    });
  }, []);

  const removeMarketplaceOrder = useCallback(
    (orderId: string) => {
      orderVersionRef.current.delete(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setDismissedIncomingIds((prev) => new Set(prev).add(orderId));
      dismissActiveJobAlert(orderId);
    },
    [dismissActiveJobAlert],
  );

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const dtos = await listOrdersRequest();
      for (const dto of dtos) {
        const ts = dto.updatedAt ?? dto.createdAt ?? "";
        if (ts) orderVersionRef.current.set(dto.id, ts);
      }
      if (role === "tasker") {
        await Promise.all(
          dtos.map((d) =>
            d.customerId ? hydrateCustomer(d.customerId, d.address, d.notes) : Promise.resolve(),
          ),
        );
      }
      const hydrated = await Promise.all(dtos.map((d) => hydrateOrderFromDto(d)));
      setOrders(hydrated);
    } catch {
      showAppToast("Could not load orders", "error");
    } finally {
      setOrdersLoading(false);
    }
  }, [hydrateOrderFromDto, hydrateCustomer, role]);

  const createAndPublishOrder = useCallback(
    async (input: CreateOrderInput) => {
      const created = await createOrderRequest(input);
      try {
        const { order } = await publishOrderRequest(created.id);
        await mergeOrderFromDto(order, { force: true });
        setActiveOrderId(order.id);
        return order.id;
      } catch (err) {
        // Create can succeed while publish fails transiently; hydrate the created order
        // so users still see it in their order list instead of a silent dead-end.
        try {
          const createdOrder = await getOrderRequest(created.id);
          await mergeOrderFromDto(createdOrder, { force: true });
          setActiveOrderId(created.id);
        } catch {
          // Ignore secondary hydration failures and surface original error.
        }
        throw err;
      }
    },
    [mergeOrderFromDto],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      const dto = await cancelOrderRequest(orderId);
      await mergeOrderFromDto(dto, { force: true });
    },
    [mergeOrderFromDto],
  );

  const refreshOrder = useCallback(
    async (orderId: string) => {
      const dto = await getOrderRequest(orderId);
      return mergeOrderFromDto(dto, { force: true });
    },
    [mergeOrderFromDto],
  );

  const upsertChatThread = useCallback((dto: ChatThreadDTO) => {
    const item = threadDtoToListItem(dto);
    setChatThreads((prev) => {
      const idx = prev.findIndex((t) => t.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
  }, []);

  const appendChatMessage = useCallback(
    (dto: ChatMessageDTO) => {
      if (!authUser?.id) return;
      const ui = messageDtoToUi(dto, authUser.id);
      setMessagesByThreadId((prev) => {
        const list = prev[dto.threadId] ?? [];
        if (list.some((m) => m.id === ui.id)) return prev;
        return { ...prev, [dto.threadId]: [...list, ui] };
      });
      setChatThreads((prev) =>
        prev.map((t) => {
          if (t.id !== dto.threadId) return t;
          const isOpen = activeChatIdRef.current === dto.threadId;
          const fromOther = dto.senderId !== authUser.id;
          return {
            ...t,
            last: dto.text,
            time: ui.time,
            unread: isOpen ? 0 : fromOther ? t.unread + 1 : t.unread,
          };
        }),
      );
    },
    [authUser?.id],
  );

  const loadChatThreads = useCallback(async () => {
    setChatLoading(true);
    try {
      const dtos = await listChatThreadsRequest();
      setChatThreads(dtos.map(threadDtoToListItem));
    } finally {
      setChatLoading(false);
    }
  }, []);

  const loadChatMessages = useCallback(
    async (threadId: string) => {
      if (!authUser?.id) return;
      const dtos = await listChatMessagesRequest(threadId);
      setMessagesByThreadId((prev) => ({
        ...prev,
        [threadId]: dtos.map((m) => messageDtoToUi(m, authUser.id)),
      }));
    },
    [authUser?.id],
  );

  const markChatThreadReadLocal = useCallback(
    async (threadId: string) => {
      try {
        const dto = await markChatThreadReadRequest(threadId);
        upsertChatThread(dto);
      } catch {
        setChatThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
        );
      }
    },
    [upsertChatThread],
  );

  const openChatForOrder = useCallback(
    async (orderId: string) => {
      const dto = await openChatThreadRequest(orderId);
      upsertChatThread(dto);
      setActiveChatId(dto.id);
      await loadChatMessages(dto.id);
      await markChatThreadReadLocal(dto.id);
      try {
        const socket = getSocket();
        if (socket.connected) {
          await joinChatThreadRoom(socket, dto.id);
        }
      } catch {
        /* optional */
      }
      navigate("chat");
    },
    [upsertChatThread, loadChatMessages, markChatThreadReadLocal, navigate],
  );

  const sendChatMessage = useCallback(
    async (threadId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !authUser?.id) return;
      const dto = await sendChatMessageRequest(threadId, trimmed);
      appendChatMessage(dto);
    },
    [authUser?.id, appendChatMessage],
  );

  const loadMyReviews = useCallback(async () => {
    if (!isAuthenticated || role !== "customer") return;
    setReviewsLoading(true);
    try {
      const dtos = await listMyReviewsRequest();
      setReviewedOrderIds(new Set(dtos.map((r) => r.orderId)));
      setReviews(dtos.map((dto) => reviewDtoToCustomerReview(dto, ordersRef.current)));
    } finally {
      setReviewsLoading(false);
    }
  }, [isAuthenticated, role]);

  const loadMyReviewsRef = useRef(loadMyReviews);

  const loadTaskerReviews = useCallback(async (taskerId: string) => {
    if (!taskerId) return null;
    setTaskerReviewsLoading(true);
    try {
      const data = await listTaskerReviewsRequest(taskerId);
      const view = mapTaskerReviewsResponse(data);
      setTaskerReviewsCache((prev) => ({ ...prev, [taskerId]: view }));
      return view;
    } catch {
      return null;
    } finally {
      setTaskerReviewsLoading(false);
    }
  }, []);

  const submitReview = useCallback(
    async (input: { orderId: string; rating: number; comment?: string }) => {
      const result = await createReviewRequest(input);
      setReviewedOrderIds((prev) => new Set(prev).add(input.orderId));
      setReviews((prev) => [
        reviewDtoToCustomerReview(result.review, orders),
        ...prev.filter((r) => r.id !== result.review.id),
      ]);
      setTaskerReviewsCache((prev) => {
        const taskerId = result.review.taskerId;
        const existing = prev[taskerId];
        if (!existing) return prev;
        return {
          ...prev,
          [taskerId]: {
            ...existing,
            averageRating: result.taskerStats.averageRating,
            totalReviews: result.taskerStats.totalReviews,
          },
        };
      });
      if (authUser?.id === result.review.taskerId) {
        setTaskerProfile((p) => ({
          ...p,
          rating: result.taskerStats.averageRating,
          totalJobs: result.taskerStats.totalReviews,
        }));
      }
    },
    [orders, authUser?.id],
  );

  const canReviewOrderById = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      return canReviewOrder(order, reviewedOrderIds);
    },
    [orders, reviewedOrderIds],
  );

  const setActiveTaskerProfileId = useCallback((taskerId?: string) => {
    activeTaskerProfileIdRef.current = taskerId;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders().catch(() => undefined);
    loadChatThreads().catch(() => undefined);
    if (role === "customer") {
      loadMyReviews().catch(() => undefined);
      loadCatalog().catch(() => undefined);
    }
    if (role === "tasker" && authUser?.id) {
      loadTaskerReviews(authUser.id).catch(() => undefined);
      loadEarnings().catch(() => undefined);
    }
  }, [
    isAuthenticated,
    role,
    authUser?.id,
    loadOrders,
    loadChatThreads,
    loadMyReviews,
    loadTaskerReviews,
    loadCatalog,
    loadEarnings,
  ]);

  useEffect(() => {
    if (!isAuthenticated || role !== "tasker" || !authUser) return;
    if (authUser.location) return;
    patchMeRequest({ location: DEFAULT_TASKER_LOCATION })
      .then((updated) => setAuthUser(updated))
      .catch(() => undefined);
  }, [isAuthenticated, role, authUser?.id, authUser?.location]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const attachSocketConnectionHandlers = (socket: ReturnType<typeof getSocket>) => {
      const onConnect = () => setSocketStatus("connected");
      const onDisconnect = () => setSocketStatus("reconnecting");
      const onReconnect = () => setSocketStatus("connected");
      const onReconnectAttempt = () => setSocketStatus("reconnecting");
      const onReconnectFailed = () => setSocketStatus("disconnected");

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.io.on("reconnect", onReconnect);
      socket.io.on("reconnect_attempt", onReconnectAttempt);
      socket.io.on("reconnect_failed", onReconnectFailed);

      if (socket.connected) onConnect();

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.io.off("reconnect", onReconnect);
        socket.io.off("reconnect_attempt", onReconnectAttempt);
        socket.io.off("reconnect_failed", onReconnectFailed);
      };
    };

    (async () => {
      try {
        setSocketStatus("connecting");
        const socket = await connectSocket();
        if (cancelled) return;

        const detachConnectionHandlers = attachSocketConnectionHandlers(socket);

        realtimeTeardownRef.current?.();
        const orderTeardown = attachOrderSync(socket, {
          mergeOrderDto: mergeOrderFromDto,
          removeMarketplaceOrder,
          loadOrders,
          fetchOrderById: getOrderRequest,
          isTasker: role === "tasker",
          versionRef: orderVersionRef,
        });
        const chatTeardown = attachChatSync(socket, {
          onMessage: appendChatMessage,
          onThreadUpdated: upsertChatThread,
          loadThreads: loadChatThreads,
          loadMessages: loadChatMessages,
          activeChatIdRef,
        });
        const reviewTeardown = attachReviewSync(socket, {
          onReviewCreated: (payload) => {
            if (authUser?.id === payload.review.taskerId) {
              setTaskerProfile((p) => ({
                ...p,
                rating: payload.taskerStats.averageRating,
                totalJobs: payload.taskerStats.totalReviews,
              }));
            }
          },
          refreshMyReviews: () => loadMyReviewsRef.current(),
          refreshTaskerReviews: (taskerId) =>
            loadTaskerReviews(taskerId).then(() => undefined),
          activeTaskerProfileIdRef,
          authUserId: authUser?.id,
        });

        let presenceTeardown: (() => void) | undefined;
        let jobAlertTeardown: (() => void) | undefined;

        if (role === "tasker" && authUser?.id) {
          presenceTeardown = attachTaskerPresenceSync(socket, {
            userId: authUser.id,
            getIsOnline: () => onlineRef.current,
            getIsActive: () => appIsActiveRef.current,
          });

          jobAlertTeardown = attachTaskerJobAlertSync(socket, {
            prefetchOrder: async (orderId) => {
              const dto = await getOrderRequest(orderId);
              await mergeOrderFromDto(dto, { force: true });
            },
            onPayload: (payload) => {
              if (!onlineRef.current) return;
              presentNewJobAvailableAlert(payload, {
                onPresent: (alert) => setActiveAlertJob(alert),
              });
            },
          });
        }

        realtimeTeardownRef.current = () => {
          detachConnectionHandlers();
          orderTeardown();
          chatTeardown();
          reviewTeardown();
          presenceTeardown?.();
          jobAlertTeardown?.();
        };
      } catch {
        if (!cancelled) setSocketStatus("disconnected");
      }
    })();

    return () => {
      cancelled = true;
      realtimeTeardownRef.current?.();
      realtimeTeardownRef.current = null;
    };
  }, [
    isAuthenticated,
    role,
    mergeOrderFromDto,
    removeMarketplaceOrder,
    loadOrders,
    appendChatMessage,
    upsertChatThread,
    loadChatThreads,
    loadChatMessages,
    loadTaskerReviews,
    authUser?.id,
  ]);

  const taskerLocation = authUser?.location ?? DEFAULT_TASKER_LOCATION;

  const incoming = useMemo((): JobRequest[] => {
    if (role !== "tasker" || !authUser?.id) return [];
    return orders
      .filter((o) => isTaskerIncomingOrder(o, authUser.id) && !dismissedIncomingIds.has(o.id))
      .map((o) => {
        const customer =
          (o.customerId ? customerCacheRef.current.get(o.customerId) : undefined) ??
          fallbackCustomerStub(o.customerId, o.address, o.notes);
        return orderToJobRequest(o, customer, taskerLocation);
      });
  }, [orders, role, authUser?.id, dismissedIncomingIds, taskerLocation]);

  const taskerJobs = useMemo((): TaskerJob[] => {
    if (role !== "tasker" || !authUser?.id) return [];
    return orders
      .filter((o) => isTaskerOwnedOrder(o, authUser.id))
      .map((o) => {
        const customer =
          (o.customerId ? customerCacheRef.current.get(o.customerId) : undefined) ??
          fallbackCustomerStub(o.customerId, o.address, o.notes);
        return orderToTaskerJob(o, customer, taskerLocation);
      })
      .filter((j): j is TaskerJob => j !== null);
  }, [orders, role, authUser?.id, taskerLocation]);

  const activeJobs = useMemo(
    (): ActiveJob[] => taskerJobs.filter((j) => !j.isTerminal),
    [taskerJobs],
  );

  const setOnlineAndSync = useCallback(
    async (value: boolean) => {
      setOnline(value);
      if (!value) setActiveAlertJob(null);
      if (role !== "tasker" || !isAuthenticated) return;
      const location = authUser?.location ?? DEFAULT_TASKER_LOCATION;
      try {
        const updated = await patchMeRequest({ online: value, location });
        setAuthUser(updated);
        if (authUser?.id) {
          emitTaskerToggleOnline(getSocket(), authUser.id, value);
        }
      } catch {
        setOnline(!value);
      }
    },
    [role, isAuthenticated, authUser?.id, authUser?.location],
  );

  const acceptJob = useCallback(
    async (orderId: string) => {
      setAcceptJobError(null);
      try {
        const dto = await acceptOrderRequest(orderId, createIdempotencyKey("accept"));
        if (dto.customerId) {
          await hydrateCustomer(dto.customerId, dto.address, dto.notes);
        }
        await mergeOrderFromDto(dto, { force: true });
        setDismissedIncomingIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
        setSelectedJobId(orderId);
      } catch (err) {
        if (isConflictError(err)) {
          await loadOrders();
          dismissActiveJobAlert(orderId);
          const message =
            err instanceof Error
              ? err.message
              : "This job was already claimed by another tasker.";
          setAcceptJobError(message);
          throw new Error(message);
        }
        throw err;
      }
    },
    [mergeOrderFromDto, hydrateCustomer, loadOrders, dismissActiveJobAlert],
  );

  useEffect(() => {
    acceptJobRef.current = acceptJob;
  }, [acceptJob]);

  const advanceJob = useCallback(
    async (orderId: string, action: "arrive" | "start" | "complete") => {
      try {
        let dto: OrderDTO;
        switch (action) {
          case "arrive":
            dto = await arriveOrderRequest(orderId);
            break;
          case "start":
            dto = await startOrderRequest(orderId);
            break;
          case "complete":
            dto = await completeOrderRequest(orderId);
            break;
        }
        return mergeOrderFromDto(dto, { force: true });
      } catch (err) {
        if (isInvalidStateTransitionError(err)) {
          try {
            const fresh = await getOrderRequest(orderId);
            await mergeOrderFromDto(fresh, { force: true });
          } catch {
            await loadOrders();
          }
          const details = err.details;
          const from =
            details && typeof details === "object" && "from" in details
              ? String((details as { from: string }).from)
              : "current";
          const to =
            details && typeof details === "object" && "to" in details
              ? String((details as { to: string }).to)
              : action;
          throw new Error(
            `Cannot update job while order is "${from}" (requested "${to}"). Pull to refresh or wait for payment.`,
          );
        }
        throw err;
      }
    },
    [mergeOrderFromDto, loadOrders],
  );

  const rejectJob = useCallback(
    (orderId: string) => {
      setDismissedIncomingIds((prev) => new Set(prev).add(orderId));
      dismissActiveJobAlert(orderId);
    },
    [dismissActiveJobAlert],
  );

  useEffect(() => {
    rejectJobRef.current = rejectJob;
  }, [rejectJob]);

  const clearAcceptJobError = useCallback(() => setAcceptJobError(null), []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: Role;
    }): Promise<UserDTO> => {
      const session = await registerRequest({
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: input.password,
        role: input.role,
      });
      if (isUserBlocked(session.user)) {
        throw new Error("Your account has been blocked. Please contact support.");
      }
      await setAccessToken(session.token);
      applySession(session.user, session.token);
      return session.user;
    },
    [applySession],
  );

  const addOrder = (o: Order) => setOrders((p) => [o, ...p]);
  
  const updateOrder = (id: string, patch: Partial<Order>) =>
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    
  const value: Ctx = useMemo(
    () => ({
      screen, navigate, switchTab, back, role, setRole,
      authUser, authToken, authLoading, isAuthenticated,
      socketStatus, retrySocketConnection, showToast,
      login, register, logout, resolvePostAuthScreen,
      selectedCategory, setSelectedCategory, startCategoryBooking,
      selectedService, setSelectedService,
      selectedTasker, setSelectedTasker,
      booking, setBooking,
      orders, ordersLoading, addOrder, updateOrder,
      loadOrders, refreshOrder, createAndPublishOrder, cancelOrder,
      activeOrderId, setActiveOrderId,
      reviews,
      reviewedOrderIds,
      reviewsLoading,
      loadMyReviews,
      submitReview,
      canReviewOrder: canReviewOrderById,
      taskerReviewsCache,
      taskerReviewsLoading,
      loadTaskerReviews,
      setActiveTaskerProfileId,
      chatThreads,
      messagesByThreadId,
      chatLoading,
      loadChatThreads,
      loadChatMessages,
      openChatForOrder,
      sendChatMessage,
      markChatThreadRead: markChatThreadReadLocal,
      activeChatId,
      setActiveChatId,
      user, setUser, syncProfileFromDto,
      addresses, setAddresses, saveAddresses,
      notif, setNotif, darkMode, setDarkMode, language, setLanguage,
      online, setOnline: setOnlineAndSync, taskerProfile, setTaskerProfile,
      documents, setDocuments,
      incoming,
      activeAlertJob,
      dismissActiveJobAlert,
      taskerJobs,
      activeJobs,
      acceptJob, rejectJob, advanceJob, acceptJobError, clearAcceptJobError,
      selectedJobId, setSelectedJobId,
      selectedRequestId, setSelectedRequestId,
      transactions,
      weeklyEarnings,
      earningsLoading,
      reloadEarnings: loadEarnings,
      catalogServices,
      catalogTaskers,
      catalogCategories,
      catalogLoading,
      catalogError,
      reloadCatalog: loadCatalog,
      taskerServices, setTaskerServices,
    }),
    [
      screen, switchTab, role, selectedCategory, startCategoryBooking, selectedService, selectedTasker,
      booking, orders, ordersLoading, activeOrderId, reviews, reviewedOrderIds, reviewsLoading,
      loadMyReviews, submitReview, canReviewOrderById, taskerReviewsCache, taskerReviewsLoading,
      loadTaskerReviews, setActiveTaskerProfileId,
      chatThreads, messagesByThreadId, chatLoading, activeChatId,
      loadChatThreads, loadChatMessages, openChatForOrder, sendChatMessage, markChatThreadReadLocal,
      loadOrders, refreshOrder, createAndPublishOrder, cancelOrder,
      user, syncProfileFromDto, addresses, notif, darkMode, language, online, taskerProfile,
      documents, incoming, activeAlertJob, dismissActiveJobAlert, taskerJobs, activeJobs,
      selectedJobId, selectedRequestId,
      taskerServices,
      transactions, weeklyEarnings, earningsLoading,
      catalogServices, catalogTaskers, catalogCategories, catalogLoading, catalogError,
      loadCatalog, loadEarnings,
      authUser, authToken, authLoading, isAuthenticated,
      socketStatus, retrySocketConnection, showToast,
      login, register, logout, resolvePostAuthScreen,
      acceptJob, rejectJob, advanceJob, acceptJobError, clearAcceptJobError,
      setOnlineAndSync, saveAddresses,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
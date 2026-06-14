import type { LucideIcon } from "lucide-react";
import { DollarSign, ShoppingBag, UserCheck, Users } from "lucide-react";

export type VerificationStatus = "pending" | "verified" | "rejected";
export type AccountStatus = "active" | "blocked";

/** KYC payload from POST /users/me/kyc (stored on users.kyc). */
export type TaskerKyc = {
  fullName?: string;
  dob?: string;
  address?: string;
  phone?: string;
  cccdFront?: string;
  cccdBack?: string;
  submittedAt?: string;
};

export type Tasker = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  jobs: number;
  earnings: number;
  online: boolean;
  verified: VerificationStatus;
  status: AccountStatus;
  category: string;
  joinDate: string;
  kyc?: TaskerKyc | null;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  orders: number;
  joined: string;
  status: AccountStatus;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  icon: string;
  price: number;
  active: boolean;
  count: number;
  description: string;
};

export type OrderStatus = "pending" | "ongoing" | "completed" | "cancelled";
export type PaymentStatus = "paid" | "unpaid" | "refunded" | "failed";

export type Order = {
  id: string;
  customer: string;
  tasker: string;
  service: string;
  amount: number;
  status: OrderStatus;
  payment: PaymentStatus;
  date: string;
};

export type Complaint = {
  id: string;
  subject: string;
  customer: string;
  tasker: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved" | "escalated";
  category: string;
  date: string;
  assigned: string;
};

export type Transaction = {
  id: string;
  date: string;
  party: string;
  type: "payout" | "commission" | "refund" | "bonus";
  amount: number;
  status: "completed" | "pending" | "failed";
};

export type DashboardStat = {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tint?: "primary" | "accent" | "info" | "warning";
};

export type RevenueChartPoint = {
  month: string;
  revenue: number;
  orders: number;
};

export const taskers: Tasker[] = [
  {
    id: "TKR-1001",
    name: "Jordan Reeves",
    email: "jordan@taskgo.app",
    phone: "+1 555-0201",
    avatar: "https://i.pravatar.cc/200?img=33",
    rating: 4.9,
    jobs: 312,
    earnings: 18420,
    online: true,
    verified: "verified",
    status: "active",
    category: "Cleaning",
    joinDate: "Jan 2025",
  },
  {
    id: "TKR-1002",
    name: "Sofia Chen",
    email: "sofia@taskgo.app",
    phone: "+1 555-0202",
    avatar: "https://i.pravatar.cc/200?img=45",
    rating: 4.85,
    jobs: 198,
    earnings: 12650,
    online: true,
    verified: "verified",
    status: "active",
    category: "Handyman",
    joinDate: "Mar 2025",
  },
  {
    id: "TKR-1003",
    name: "Marcus Delgado",
    email: "marcus@taskgo.app",
    phone: "+1 555-0203",
    avatar: "https://i.pravatar.cc/200?img=12",
    rating: 4.7,
    jobs: 87,
    earnings: 5420,
    online: false,
    verified: "pending",
    status: "active",
    category: "Painting",
    joinDate: "Apr 2026",
  },
  {
    id: "TKR-1004",
    name: "Priya Nair",
    email: "priya@taskgo.app",
    phone: "+1 555-0204",
    avatar: "https://i.pravatar.cc/200?img=5",
    rating: 4.95,
    jobs: 156,
    earnings: 9800,
    online: true,
    verified: "pending",
    status: "active",
    category: "Gardening",
    joinDate: "May 2026",
  },
  {
    id: "TKR-1005",
    name: "Ethan Walsh",
    email: "ethan@taskgo.app",
    phone: "+1 555-0205",
    avatar: "https://i.pravatar.cc/200?img=15",
    rating: 4.6,
    jobs: 124,
    earnings: 7200,
    online: true,
    verified: "verified",
    status: "active",
    category: "Electric",
    joinDate: "Feb 2025",
  },
  {
    id: "TKR-1006",
    name: "Lina Ortiz",
    email: "lina@taskgo.app",
    phone: "+1 555-0206",
    avatar: "https://i.pravatar.cc/200?img=25",
    rating: 4.8,
    jobs: 241,
    earnings: 14100,
    online: false,
    verified: "rejected",
    status: "blocked",
    category: "Cleaning",
    joinDate: "Dec 2024",
  },
  {
    id: "TKR-1007",
    name: "Noah Park",
    email: "noah@taskgo.app",
    phone: "+1 555-0207",
    avatar: "https://i.pravatar.cc/200?img=52",
    rating: 4.55,
    jobs: 73,
    earnings: 4100,
    online: true,
    verified: "pending",
    status: "active",
    category: "Moving",
    joinDate: "May 2026",
  },
  {
    id: "TKR-1008",
    name: "Amelia Foster",
    email: "amelia@taskgo.app",
    phone: "+1 555-0208",
    avatar: "https://i.pravatar.cc/200?img=9",
    rating: 5.0,
    jobs: 402,
    earnings: 22800,
    online: true,
    verified: "verified",
    status: "active",
    category: "Plumbing",
    joinDate: "Nov 2024",
  },
];

export const customers: Customer[] = [
  {
    id: "CUS-2001",
    name: "Alex Morgan",
    email: "customer@taskgo.app",
    avatar: "https://i.pravatar.cc/200?img=68",
    phone: "+1 555-0142",
    orders: 24,
    joined: "Oct 2024",
    status: "active",
  },
  {
    id: "CUS-2002",
    name: "Jamie Brooks",
    email: "customer2@taskgo.app",
    avatar: "https://i.pravatar.cc/200?img=32",
    phone: "+1 555-0143",
    orders: 11,
    joined: "Jan 2025",
    status: "active",
  },
  {
    id: "CUS-2003",
    name: "Taylor Kim",
    email: "customer3@taskgo.app",
    avatar: "https://i.pravatar.cc/200?img=47",
    phone: "+1 555-0144",
    orders: 7,
    joined: "Mar 2025",
    status: "active",
  },
  {
    id: "CUS-2004",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    avatar: "https://i.pravatar.cc/200?img=20",
    phone: "+1 555-0145",
    orders: 18,
    joined: "Jun 2024",
    status: "active",
  },
  {
    id: "CUS-2005",
    name: "Mark Thompson",
    email: "mark.t@email.com",
    avatar: "https://i.pravatar.cc/200?img=11",
    phone: "+1 555-0146",
    orders: 3,
    joined: "May 2026",
    status: "blocked",
  },
];

export const services: Service[] = [
  {
    id: "SVC-1",
    name: "Deep Home Cleaning",
    category: "Cleaning",
    icon: "✨",
    price: 49,
    active: true,
    count: 12,
    description: "Thorough home cleaning including kitchen, bathrooms, and floors.",
  },
  {
    id: "SVC-2",
    name: "Pipe Leak Repair",
    category: "Plumbing",
    icon: "🔧",
    price: 35,
    active: true,
    count: 8,
    description: "Fast diagnosis and repair for leaks and faucet issues.",
  },
  {
    id: "SVC-3",
    name: "Interior Painting",
    category: "Painting",
    icon: "🎨",
    price: 120,
    active: true,
    count: 6,
    description: "Professional interior wall painting with prep and cleanup.",
  },
  {
    id: "SVC-4",
    name: "Furniture Assembly",
    category: "Handyman",
    icon: "🪛",
    price: 38,
    active: true,
    count: 15,
    description: "Flat-pack and modular furniture assembly.",
  },
  {
    id: "SVC-5",
    name: "Garden Maintenance",
    category: "Gardening",
    icon: "🌿",
    price: 42,
    active: true,
    count: 9,
    description: "Lawn care, hedge trimming, and seasonal yard cleanup.",
  },
  {
    id: "SVC-6",
    name: "AC Service",
    category: "AC Repair",
    icon: "❄️",
    price: 39,
    active: false,
    count: 4,
    description: "AC tune-up, filter change, and performance check.",
  },
];

export const orders: Order[] = [
  { id: "ORD-9001", customer: "Alex Morgan", tasker: "Jordan Reeves", service: "Deep Cleaning", amount: 78, status: "completed", payment: "paid", date: "May 18, 2026" },
  { id: "ORD-9002", customer: "Sarah Johnson", tasker: "Sofia Chen", service: "Pipe Repair", amount: 45, status: "ongoing", payment: "paid", date: "May 18, 2026" },
  { id: "ORD-9003", customer: "Mark Thompson", tasker: "Ethan Walsh", service: "AC Service", amount: 39, status: "pending", payment: "unpaid", date: "May 17, 2026" },
  { id: "ORD-9004", customer: "Jamie Brooks", tasker: "Amelia Foster", service: "Plumbing", amount: 55, status: "completed", payment: "paid", date: "May 17, 2026" },
  { id: "ORD-9005", customer: "Taylor Kim", tasker: "Priya Nair", service: "Gardening", amount: 42, status: "cancelled", payment: "refunded", date: "May 16, 2026" },
  { id: "ORD-9006", customer: "Alex Morgan", tasker: "Noah Park", service: "Moving Help", amount: 65, status: "ongoing", payment: "paid", date: "May 16, 2026" },
  { id: "ORD-9007", customer: "Sarah Johnson", tasker: "Jordan Reeves", service: "Deep Cleaning", amount: 49, status: "pending", payment: "unpaid", date: "May 15, 2026" },
  { id: "ORD-9008", customer: "Mark Thompson", tasker: "Marcus Delgado", service: "Painting", amount: 120, status: "completed", payment: "paid", date: "May 14, 2026" },
  { id: "ORD-9009", customer: "Jamie Brooks", tasker: "Sofia Chen", service: "Handyman", amount: 38, status: "ongoing", payment: "paid", date: "May 14, 2026" },
  { id: "ORD-9010", customer: "Taylor Kim", tasker: "Lina Ortiz", service: "Laundry", amount: 28, status: "completed", payment: "paid", date: "May 13, 2026" },
  { id: "ORD-9011", customer: "Alex Morgan", tasker: "Ethan Walsh", service: "Electric", amount: 55, status: "cancelled", payment: "failed", date: "May 12, 2026" },
  { id: "ORD-9012", customer: "Sarah Johnson", tasker: "Amelia Foster", service: "Plumbing", amount: 48, status: "completed", payment: "paid", date: "May 11, 2026" },
];

export const complaints: Complaint[] = [
  {
    id: "CMP-9001",
    subject: "Damaged furniture during move",
    customer: "Sarah Johnson",
    tasker: "Noah Park",
    priority: "high",
    status: "open",
    category: "Damage",
    date: "May 18, 2026",
    assigned: "Admin Team",
  },
  {
    id: "CMP-9002",
    subject: "Tasker no-show for cleaning",
    customer: "Mark Thompson",
    tasker: "Lina Ortiz",
    priority: "urgent",
    status: "in-progress",
    category: "No-show",
    date: "May 17, 2026",
    assigned: "Sara Admin",
  },
  {
    id: "CMP-9003",
    subject: "Overcharged for AC service",
    customer: "Jamie Brooks",
    tasker: "Ethan Walsh",
    priority: "medium",
    status: "open",
    category: "Billing",
    date: "May 16, 2026",
    assigned: "Finance",
  },
  {
    id: "CMP-9004",
    subject: "Poor quality paint job",
    customer: "Taylor Kim",
    tasker: "Marcus Delgado",
    priority: "low",
    status: "resolved",
    category: "Quality",
    date: "May 10, 2026",
    assigned: "Sara Admin",
  },
  {
    id: "CMP-9005",
    subject: "Rude behavior reported",
    customer: "Alex Morgan",
    tasker: "Jordan Reeves",
    priority: "medium",
    status: "escalated",
    category: "Conduct",
    date: "May 9, 2026",
    assigned: "Trust & Safety",
  },
];

export const transactions: Transaction[] = [
  { id: "TX-5001", date: "May 18, 2026", party: "Jordan Reeves", type: "payout", amount: 66.3, status: "completed" },
  { id: "TX-5002", date: "May 18, 2026", party: "TaskGo Platform", type: "commission", amount: 11.7, status: "completed" },
  { id: "TX-5003", date: "May 17, 2026", party: "Amelia Foster", type: "payout", amount: 46.75, status: "pending" },
  { id: "TX-5004", date: "May 17, 2026", party: "Taylor Kim", type: "refund", amount: 42, status: "completed" },
  { id: "TX-5005", date: "May 16, 2026", party: "Noah Park", type: "payout", amount: 55.25, status: "completed" },
  { id: "TX-5006", date: "May 15, 2026", party: "TaskGo Platform", type: "bonus", amount: 500, status: "completed" },
  { id: "TX-5007", date: "May 14, 2026", party: "Marcus Delgado", type: "payout", amount: 102, status: "failed" },
];

export const dashboardStats: DashboardStat[] = [
  { label: "Total revenue", value: "$48,290", delta: 12.4, icon: DollarSign, tint: "primary" },
  { label: "Active orders", value: "127", delta: 8.2, icon: ShoppingBag, tint: "info" },
  { label: "Customers", value: "2,841", delta: 5.1, icon: Users, tint: "accent" },
  { label: "Taskers online", value: "86", delta: -2.3, icon: UserCheck, tint: "warning" },
];

export const revenueChartData: RevenueChartPoint[] = [
  { month: "Jan", revenue: 32000, orders: 420 },
  { month: "Feb", revenue: 35500, orders: 465 },
  { month: "Mar", revenue: 38200, orders: 498 },
  { month: "Apr", revenue: 41000, orders: 520 },
  { month: "May", revenue: 48290, orders: 612 },
];

export const topbarNotifications = [
  { title: "New tasker awaiting approval", time: "5 min ago" },
  { title: "Complaint CMP-9002 escalated", time: "12 min ago" },
  { title: "Revenue target reached for May", time: "1 hr ago" },
  { title: "3 new customer signups", time: "2 hr ago" },
] as const;

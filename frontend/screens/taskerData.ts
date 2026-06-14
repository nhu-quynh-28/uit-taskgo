export type JobRequest = {
  id: string;
  customer: { name: string; avatar: string; phone: string; address: string; notes?: string };
  service: string;
  serviceIcon?: string;
  distanceKm: number;
  durationEst: string;
  earnings: number;
  scheduledAt: string;
  description: string;
  photos: string[];
  countdown: number; // seconds
};

export type ActiveJob = JobRequest & {
  status:
    | "pending"
    | "accepted"
    | "onTheWay"
    | "arrived"
    | "working"
    | "completed"
    | "cancelled";
  acceptedAt: string;
  progress: { step: string; time: string; note?: string; photo?: string }[];
};

export type Transaction = {
  id: string;
  date: string;
  customer: string;
  service: string;
  gross: number;
  commission: number;
  net: number;
  type: "service" | "bonus" | "refund";
};

export type TaskerReview = {
  id: string;
  customer: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  service: string;
  reply?: string;
};

export const monthlyEarnings = [1200, 1450, 1380, 1680];

export const serviceCategoryOptions = [
  "Cleaning", "Plumbing", "Painting", "Moving", "Handyman", "Gardening", "AC Repair", "Electric", "Laundry", "Baby Sitter",
];

export const skillOptions = [
  "Deep Cleaning", "Office Cleaning", "Window Cleaning", "Pipe Repair", "Faucet Install",
  "Wall Painting", "Furniture Assembly", "TV Mounting", "Lawn Care", "AC Service",
];

export const initialTaskerServices = [
  { id: "ts1", name: "Deep Home Cleaning", price: 49, hourly: 22, duration: "3 hrs", active: true, description: "Full home deep clean with eco products." },
  { id: "ts2", name: "Office Cleaning", price: 65, hourly: 25, duration: "4 hrs", active: true, description: "Workspace sanitizing and dusting." },
  { id: "ts3", name: "Window Cleaning", price: 30, hourly: 18, duration: "2 hrs", active: false, description: "Streak-free interior and exterior windows." },
];

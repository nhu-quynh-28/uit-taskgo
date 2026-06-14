import {
  Baby,
  Hammer,
  Leaf,
  Paintbrush,
  Plug,
  Shirt,
  Sparkles,
  Truck,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";

export type TaskGoCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  /** Values from API `service.category` (e.g. home, repair, outdoor). */
  backendCategories: string[];
  /** Values from API `service.icon` — usually matches `id`. */
  iconKeys: string[];
};

export const TASKGO_CATEGORIES: TaskGoCategory[] = [
  {
    id: "cleaning",
    label: "Cleaning",
    icon: Sparkles,
    color: "bg-emerald-100",
    backendCategories: ["home"],
    iconKeys: ["cleaning", "home"],
  },
  {
    id: "plumbing",
    label: "Plumbing",
    icon: Wrench,
    color: "bg-blue-100",
    backendCategories: ["repair"],
    iconKeys: ["plumbing", "repair"],
  },
  {
    id: "painting",
    label: "Painting",
    icon: Paintbrush,
    color: "bg-amber-100",
    backendCategories: ["home"],
    iconKeys: ["painting"],
  },
  {
    id: "moving",
    label: "Moving",
    icon: Truck,
    color: "bg-rose-100",
    backendCategories: ["home"],
    iconKeys: ["moving"],
  },
  {
    id: "handyman",
    label: "Handyman",
    icon: Hammer,
    color: "bg-orange-100",
    backendCategories: ["home", "repair"],
    iconKeys: ["handyman"],
  },
  {
    id: "gardening",
    label: "Gardening",
    icon: Leaf,
    color: "bg-lime-100",
    backendCategories: ["outdoor"],
    iconKeys: ["gardening", "outdoor"],
  },
  {
    id: "ac",
    label: "AC Repair",
    icon: Wind,
    color: "bg-cyan-100",
    backendCategories: ["repair"],
    iconKeys: ["ac"],
  },
  {
    id: "electric",
    label: "Electric",
    icon: Plug,
    color: "bg-yellow-100",
    backendCategories: ["repair"],
    iconKeys: ["electric", "electrical"],
  },
  {
    id: "laundry",
    label: "Laundry",
    icon: Shirt,
    color: "bg-indigo-100",
    backendCategories: ["home"],
    iconKeys: ["laundry"],
  },
  {
    id: "babysit",
    label: "Baby Sitter",
    icon: Baby,
    color: "bg-pink-100",
    backendCategories: ["home"],
    iconKeys: ["babysit"],
  },
];

/** Grid shown on Home (first 8 marketplace categories). */
export const HOME_CATEGORY_GRID = TASKGO_CATEGORIES.slice(0, 8);

export function getCategoryById(categoryId: string): TaskGoCategory | undefined {
  return TASKGO_CATEGORIES.find((c) => c.id === categoryId);
}

export function getCategoryLabel(categoryId: string): string {
  return getCategoryById(categoryId)?.label ?? categoryId;
}

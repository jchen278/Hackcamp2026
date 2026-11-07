import { z } from "zod";
import { FoodCategoryEnum } from "@/features/vision/types";

export const PantryStatusEnum = z.enum(["active", "under_maintenance", "inactive"]);
export type PantryStatus = z.infer<typeof PantryStatusEnum>;

export interface PantryLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: PantryStatus;
  capacityPct: number;
  cleanliness: "clean" | "moderate" | "needs_attention";
  lastScannedAt: string | null;
}

export interface InventoryItem {
  id: string;
  pantryId: string;
  name: string;
  category: z.infer<typeof FoodCategoryEnum>;
  quantity: number;
  unit: string;
  isPerishable: boolean;
  updatedAt: string;
}

export interface RestockAlertPayload {
  event: "PANTRY_LOW_STOCK";
  pantryId: string;
  pantryName: string;
  address: string;
  currentCapacityPct: number;
  urgentNeeds: {
    category: z.infer<typeof FoodCategoryEnum>;
    currentQuantity: number;
  }[];
  timestamp: string;
}
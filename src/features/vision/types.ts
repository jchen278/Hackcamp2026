import { z } from "zod";

export const FoodCategoryEnum = z.enum([
  "canned_goods",
  "fresh_produce",
  "dairy_and_eggs",
  "prepared_meals",
  "bakery",
  "dry_staples",
  "beverages",
  "hygiene",
  "other",
]);

export type FoodCategory = z.infer<typeof FoodCategoryEnum>;

export const ExtractedItemSchema = z.object({
  id: z.string().optional(), // temporary UUID for UI key tracking in review tables
  name: z.string().min(1, "Item name required").describe("Standardized common food name, e.g., 'Canned Black Beans'"),
  category: FoodCategoryEnum,
  estimatedQuantity: z.number().int().min(1).describe("Estimated count of visible units"),
  unit: z.enum(["units", "loaves", "cans", "boxes", "bags", "liters"]),
  isPerishable: z.boolean(),
  needsRemoval: z.boolean().default(false).describe("True if item appears spoiled, severely damaged, or unsealed"),
  notes: z.string().nullable().optional().describe("e.g., 'half-full gallon', 'soft bruising'"),
});

export const FridgeScanResponseSchema = z.object({
  capacityEstimatePct: z.number().int().min(0).max(100).describe("Overall fridge fullness 0-100"),
  cleanlinessScore: z.enum(["clean", "moderate", "needs_attention"]),
  items: z.array(ExtractedItemSchema),
});

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type FridgeScanResponse = z.infer<typeof FridgeScanResponseSchema>;
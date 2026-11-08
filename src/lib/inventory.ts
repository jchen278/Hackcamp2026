// Shapes kept close to what a future Gemini response / database row will look like.
export type Category =
  | "Produce"
  | "Dairy"
  | "Bakery"
  | "Pantry Staples"
  | "Prepared Meals"
  | "Protein"
  | "Beverages"
  | "Other";

export const CATEGORIES: Category[] = [
  "Produce",
  "Dairy",
  "Bakery",
  "Pantry Staples",
  "Prepared Meals",
  "Protein",
  "Beverages",
  "Other",
];

export type Perishability = "high" | "medium" | "low";

export interface InventoryItem {
  name: string;
  category: Category;
  quantity: number;
  perishability?: Perishability | undefined;
  unit?: string | null;
  updatedAt: string;
}

export interface DetectedItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  perishability?: Perishability | undefined;
  confidence?: number; // 0..1
  source: "ai" | "manual";
}

export interface UpdateRecord {
  id: string;
  fridgeId: string;
  submittedBy: string;
  submittedAt: string;
  photoName: string;
  items: {
    name: string;
    category: Category;
    quantity: number;
    isNew: boolean;
  }[];
}

export interface Fridge {
  id: string;
  name: string;
  address: string;
  neighbourhood: string;
  status: "Well stocked" | "Running low" | "Nearly empty";
  map: { x: number; y: number }; // percent position on the preview map
  coordinates?: { lat: number; lng: number } | undefined; // locations without coordinates stay directory-only
  isNewLocation?: boolean;
  inventory: InventoryItem[];
  history: UpdateRecord[];
}

const norm = (s: string) => s.trim().toLowerCase();

export function isExistingItem(fridge: Fridge, name: string) {
  return fridge.inventory.some((i) => norm(i.name) === norm(name));
}

/**
 * Apply a user-confirmed update. Only call this after explicit confirmation.
 * - Detected items update matching records or are added as new.
 * - Items NOT in the photo are left untouched (never assumed out of stock).
 * - A history record is appended; previous history is preserved.
 */
export function applyConfirmedUpdate(
  fridge: Fridge,
  items: DetectedItem[],
  submittedBy: string,
  submittedAt: string,
  photoName: string,
): Fridge {
  const valid = items.filter((i) => i.name.trim() && i.quantity >= 0);
  const inventory = fridge.inventory.map((i) => ({ ...i }));
  const recordItems: UpdateRecord["items"] = [];

  for (const it of valid) {
    const existing = inventory.find((i) => norm(i.name) === norm(it.name));
    recordItems.push({
      name: it.name.trim(),
      category: it.category,
      quantity: it.quantity,
      isNew: !existing,
    });
    if (existing) {
      existing.quantity = it.quantity;
      existing.category = it.category;
      existing.perishability = it.perishability ?? existing.perishability;
      existing.updatedAt = submittedAt;
    } else {
      inventory.push({
        name: it.name.trim(),
        category: it.category,
        quantity: it.quantity,
        perishability: it.perishability,
        updatedAt: submittedAt,
      });
    }
  }

  const record: UpdateRecord = {
    id: `upd-${fridge.history.length + 1}-${submittedAt}`,
    fridgeId: fridge.id,
    submittedBy,
    submittedAt,
    photoName,
    items: recordItems,
  };

  return { ...fridge, inventory, history: [...fridge.history, record] };
}

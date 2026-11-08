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
  items: { name: string; category: Category; quantity: number; isNew: boolean }[];
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

/** Simulated Gemini recognition. Replace with a server call later; same return shape. */
export async function recognizeFridgePhoto(_file?: File): Promise<DetectedItem[]> {
  void _file;
  await new Promise((r) => setTimeout(r, 2200));
  const sample: Omit<DetectedItem, "id" | "source">[] = [
    { name: "Apples", category: "Produce", quantity: 12, perishability: "medium", confidence: 0.94 },
    { name: "Milk (1L)", category: "Dairy", quantity: 3, perishability: "high", confidence: 0.88 },
    { name: "Sliced bread", category: "Bakery", quantity: 2, perishability: "medium", confidence: 0.81 },
    { name: "Canned beans", category: "Pantry Staples", quantity: 6, perishability: "low", confidence: 0.9 },
    { name: "Yogurt cups", category: "Dairy", quantity: 8, perishability: "high", confidence: 0.67 },
    { name: "Carrots", category: "Produce", quantity: 1, perishability: "medium", confidence: 0.52 },
  ];
  return sample.map((s, i) => ({ ...s, id: `ai-${i}`, source: "ai" }));
}

const now = "2026-11-06T18:20:00.000Z";
export const SAMPLE_FRIDGES: Fridge[] = [
  {
    id: "f1",
    name: "Strathcona Community Fridge",
    address: "601 Keefer St",
    neighbourhood: "Strathcona",
    status: "Running low",
    map: { x: 62, y: 38 },
    coordinates: { lat: 49.2795, lng: -123.0910 },
    inventory: [
      { name: "Apples", category: "Produce", quantity: 4, perishability: "medium", updatedAt: now },
      { name: "Rice (1kg)", category: "Pantry Staples", quantity: 5, perishability: "low", updatedAt: now },
    ],
    history: [],
  },
  {
    id: "f2",
    name: "Mount Pleasant Free Fridge",
    address: "2780 Main St",
    neighbourhood: "Mount Pleasant",
    status: "Nearly empty",
    map: { x: 48, y: 62 },
    coordinates: { lat: 49.2606, lng: -123.1008 },
    inventory: [{ name: "Milk (1L)", category: "Dairy", quantity: 1, perishability: "high", updatedAt: now }],
    history: [],
  },
  {
    id: "f3",
    name: "Kitsilano Neighbour Fridge",
    address: "2305 W 7th Ave",
    neighbourhood: "Kitsilano",
    status: "Well stocked",
    map: { x: 22, y: 55 },
    coordinates: { lat: 49.2655, lng: -123.1587 },
    inventory: [
      { name: "Sliced bread", category: "Bakery", quantity: 6, perishability: "medium", updatedAt: now },
      { name: "Pasta", category: "Pantry Staples", quantity: 10, perishability: "low", updatedAt: now },
    ],
    history: [],
  },
  {
    id: "f4",
    name: "Commercial Drive Fridge",
    address: "1655 Commercial Dr",
    neighbourhood: "Grandview–Woodland",
    status: "Running low",
    map: { x: 78, y: 52 },
    coordinates: { lat: 49.2698, lng: -123.0696 },
    inventory: [],
    history: [],
  },
];

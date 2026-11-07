import { FridgeScanResponse } from "@/features/vision/types";

export const MOCK_SCAN_RESPONSE: FridgeScanResponse = {
  capacityEstimatePct: 45,
  cleanlinessScore: "clean",
  items: [
    {
      name: "Canned Black Beans",
      category: "canned_goods",
      estimatedQuantity: 4,
      unit: "cans",
      isPerishable: false,
      needsRemoval: false,
      notes: "Unopened 398ml cans",
    },
    {
      name: "2% Milk (2L)",
      category: "dairy_and_eggs",
      estimatedQuantity: 1,
      unit: "units",
      isPerishable: true,
      needsRemoval: false,
      notes: "Sealed carton",
    },
    {
      name: "Fuji Apples",
      category: "fresh_produce",
      estimatedQuantity: 6,
      unit: "units",
      isPerishable: true,
      needsRemoval: false,
      notes: "In clear plastic bag",
    },
    {
      name: "Sliced Sourdough Bread",
      category: "bakery",
      estimatedQuantity: 1,
      unit: "loaves",
      isPerishable: true,
      needsRemoval: false,
      notes: "Twist-tied bag",
    },
    {
      name: "Prepared Pasta Salad",
      category: "prepared_meals",
      estimatedQuantity: 2,
      unit: "boxes",
      isPerishable: true,
      needsRemoval: true,
      notes: "Unlabeled container, lid loose",
    },
  ],
};
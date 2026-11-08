import type { Fridge } from "@/lib/inventory";
import type { PendingInventorySubmission } from "@/lib/inventory-submission";

export const DEMO_LOW_STOCK_THRESHOLD = 3;

export interface AdminMetrics {
  totalFridges: number;
  needsRestocking: number;
  lowStockItems: number;
  updatesToday: number;
}

export function getAdminMetrics(
  fridges: Fridge[],
  submissions: PendingInventorySubmission[],
  now: Date = new Date()
): AdminMetrics {
  const totalFridges = fridges.length;
  const needsRestocking = fridges.filter(
    (f) => f.status === "Nearly empty" || f.status === "Running low"
  ).length;

  let lowStockItems = 0;
  for (const fridge of fridges) {
    for (const item of fridge.inventory) {
      if (item.quantity <= DEMO_LOW_STOCK_THRESHOLD) {
        lowStockItems++;
      }
    }
  }

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const updatesToday = submissions.filter((s) => {
    const time = new Date(s.submittedAt).getTime();
    return !Number.isNaN(time) && time >= startOfDay;
  }).length;

  return {
    totalFridges,
    needsRestocking,
    lowStockItems,
    updatesToday,
  };
}

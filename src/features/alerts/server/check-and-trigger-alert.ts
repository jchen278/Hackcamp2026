interface ExtractedItem {
  category: string;
  estimatedQuantity?: number;
  quantity?: number;
}

interface CheckAlertParams {
  pantryId: string;
  pantryName: string;
  address: string;
  capacityPct: number;
  items: ExtractedItem[];
}

/**
 * Evaluates pantry status and triggers the n8n restock alert webhook
 * if capacity is below 20% or critical categories have zero stock.
 */
export async function checkAndTriggerRestockAlert({
  pantryId,
  pantryName,
  address,
  capacityPct,
  items,
}: CheckAlertParams): Promise<boolean> {
  // 1. Invariant Checks (Capacity < 20% or Critical Staples depleted)
  const isCapacityLow = capacityPct < 20;

  // Track zero/low counts for critical categories (e.g. canned_goods, prepared_meals, fresh_produce)
  const criticalCategories = [
    "canned_goods",
    "prepared_meals",
    "fresh_produce",
  ];
  const urgentNeeds: Array<{ category: string; currentQuantity: number }> = [];

  for (const category of criticalCategories) {
    const matchingItems = items.filter((item) => item.category === category);
    const totalQty = matchingItems.reduce(
      (acc, item) => acc + (item.quantity ?? item.estimatedQuantity ?? 0),
      0,
    );

    if (totalQty <= 1) {
      urgentNeeds.push({ category, currentQuantity: totalQty });
    }
  }

  const shouldTriggerAlert = isCapacityLow || urgentNeeds.length > 0;

  if (!shouldTriggerAlert) {
    return false;
  }

  // 2. Dispatch to internal restock endpoint (or directly via N8N_RESTOCK_WEBHOOK_URL)
  try {
    const webhookUrl =
      process.env.N8N_RESTOCK_WEBHOOK_URL ||
      "http://localhost:3000/api/webhook/restock";

    const payload = {
      event: "PANTRY_LOW_STOCK",
      pantryId,
      pantryName,
      address,
      currentCapacityPct: capacityPct,
      urgentNeeds,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Error triggering restock alert:", error);
    return false;
  }
}

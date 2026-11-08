import { NextRequest, NextResponse } from "next/server";
import {
  getPantryInventory,
  commitScanResult,
} from "@/features/pantries/queries";
import { FridgeScanResponseSchema } from "@/features/vision/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const items = await getPantryInventory(id);
    return NextResponse.json({ data: items }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/pantries/[id] ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

// Commits volunteer-reviewed scan results
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedScan = FridgeScanResponseSchema.parse(body.scan);

    await commitScanResult(id, validatedScan);

    // Step 4 trigger: Check for low-capacity alert to dispatch to n8n
    if (
      validatedScan.capacityEstimatePct <= 20 &&
      process.env.N8N_RESTOCK_WEBHOOK_URL
    ) {
      fetch(process.env.N8N_RESTOCK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "PANTRY_LOW_STOCK",
          pantryId: id,
          currentCapacityPct: validatedScan.capacityEstimatePct,
          timestamp: new Date().toISOString(),
        }),
      }).catch((e) =>
        console.warn("n8n webhook dispatch non-blocking error:", e),
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("Scan commit error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to commit scan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

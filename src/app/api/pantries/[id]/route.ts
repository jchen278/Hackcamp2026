import { NextRequest, NextResponse } from "next/server";
import {
  getPantryAlertContext,
  getPantryInventory,
  commitScanResult,
} from "@/features/pantries/queries";
import { FridgeScanResponseSchema } from "@/features/vision/types";
import { auth0 } from "@/lib/auth0";
import { checkAndTriggerRestockAlert } from "@/features/alerts/server/check-and-trigger-alert";

// GET pantry inventory
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
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedScan = FridgeScanResponseSchema.parse(body.scan);

    await commitScanResult(id, validatedScan);

    const pantry = await getPantryAlertContext(id);
    if (!pantry) {
      return NextResponse.json({ error: "Pantry not found" }, { status: 404 });
    }

    // Evaluate and dispatch once, using only the volunteer-confirmed data that was committed.
    const restockAlertDelivered = await checkAndTriggerRestockAlert({
      pantryId: pantry.id,
      pantryName: pantry.name,
      address: pantry.address,
      capacityPct: validatedScan.capacityEstimatePct,
      items: validatedScan.items.filter((item) => !item.needsRemoval),
    });

    return NextResponse.json(
      { success: true, restockAlertDelivered },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Scan commit error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to commit scan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

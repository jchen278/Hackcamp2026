// src/app/api/scan/commit/route.ts
import { NextResponse } from "next/server";
import { commitScanResult } from "@/features/pantries/queries";
import { FridgeScanResponseSchema } from "@/features/vision/types";
import { auth0 } from "@/lib/auth0";
import { getPantryAlertContext } from "@/features/pantries/queries";
import { checkAndTriggerRestockAlert } from "@/features/alerts/server/check-and-trigger-alert";
import {
  isValidSolanaAddress,
  sendDevnetVolunteerReward,
  VOLUNTEER_REWARD_SOL,
} from "@/lib/solana";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { pantryId, scan, imageUrl, volunteerWalletAddress } = body as {
      pantryId?: unknown;
      scan?: unknown;
      imageUrl?: unknown;
      volunteerWalletAddress?: unknown;
    };

    if (!pantryId || !scan) {
      return NextResponse.json(
        { error: "pantryId and scan payload are required." },
        { status: 400 }
      );
    }

    if (typeof pantryId !== "string") {
      return NextResponse.json({ error: "Invalid pantry ID." }, { status: 400 });
    }

    const validatedScan = FridgeScanResponseSchema.parse(scan);
    const walletAddress =
      typeof volunteerWalletAddress === "string"
        ? volunteerWalletAddress.trim()
        : "";
    if (walletAddress && !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Enter a valid Solana wallet address or leave the field empty." },
        { status: 400 },
      );
    }

    await commitScanResult(pantryId, validatedScan, {
      scannedByEmail: session?.user?.email ?? "anonymous_volunteer@sharetheloaf.org",
      imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
    });

    // Evaluate the volunteer-confirmed, committed scan and dispatch an alert
    // through n8n when capacity or critical-stock thresholds are crossed.
    let restockAlertDelivered = false;
    try {
      const pantry = await getPantryAlertContext(pantryId);
      if (pantry) {
        restockAlertDelivered = await checkAndTriggerRestockAlert({
          pantryId: pantry.id,
          pantryName: pantry.name,
          address: pantry.address,
          capacityPct: validatedScan.capacityEstimatePct,
          items: validatedScan.items.filter((item) => !item.needsRemoval),
        });
      } else {
        console.warn(`Restock alert skipped: pantry ${pantryId} was not found.`);
      }
    } catch (alertError) {
      // The inventory commit succeeded; an alert outage should not discard it.
      console.error("Restock alert check failed after scan commit:", alertError);
    }

    let solanaRewardStatus: "sent" | "not_requested" | "failed" =
      "not_requested";
    let solanaRewardTx: string | null = null;
    if (walletAddress) {
      try {
        solanaRewardTx = await sendDevnetVolunteerReward(walletAddress);
        solanaRewardStatus = "sent";
      } catch (rewardError) {
        solanaRewardStatus = "failed";
        console.error("Devnet volunteer reward failed:", rewardError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        restockAlertDelivered,
        solanaRewardStatus,
        solanaRewardTx,
        solanaRewardAmount: solanaRewardStatus === "sent" ? VOLUNTEER_REWARD_SOL : 0,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("POST /api/scan/commit failed:", err);
    return NextResponse.json(
      { error: "Failed to commit scan results to database." },
      { status: 500 }
    );
  }
}

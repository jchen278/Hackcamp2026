// src/app/api/scan/commit/route.ts
import { NextResponse } from "next/server";
import { commitScanResult } from "@/features/pantries/queries";
import { auth0 } from "@/lib/auth0";

export async function POST(request: Request) {
  try {
    const session = await auth0.getSession();
    const body = await request.json();
    const { pantryId, scan, imageUrl } = body;

    if (!pantryId || !scan) {
      return NextResponse.json(
        { error: "pantryId and scan payload are required." },
        { status: 400 }
      );
    }

    await commitScanResult(pantryId, scan, {
      scannedByEmail: session?.user?.email ?? "anonymous_volunteer@pantrypulse.org",
      imageUrl: imageUrl ?? null,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("POST /api/scan/commit failed:", err);
    return NextResponse.json(
      { error: "Failed to commit scan results to database." },
      { status: 500 }
    );
  }
}
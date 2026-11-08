import { NextRequest, NextResponse } from "next/server";
import { parseFridgeImage } from "@/features/vision/server/parse-fridge-image";
import { auth0 } from "@/lib/auth0";
import { getUserPoints, updateUserPoints } from "@/lib/auth0-management";

// export const maxDuration = 30; // 30-second timeout for image processing
import { checkAndTriggerRestockAlert } from "@/features/alerts/server/check-and-trigger-alert";
import { uploadAuditImage } from "@/lib/vultr-storage";

export const maxDuration = 60; // Extended timeout for Vultr upload + Gemini vision

export async function POST(req: NextRequest) {
  console.log("--> /api/scan hit!");
  console.log("--> GEMINI_API_KEY detected:", !!process.env.GEMINI_API_KEY);
  console.log("--> VULTR_BUCKET detected:", !!process.env.VULTR_BUCKET_NAME);

  try {
    // 1. Extract verified volunteer session from Auth0
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Volunteer login required." },
        { status: 401 }
      );
    }

    const volunteerEmail = session.user.email;

    // 2. Parse uploaded scan image payload
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";

    // 3. Upload photo to Vultr Object Storage (S3-compatible)
    let imageUrl: string | null = null;
    try {
      imageUrl = await uploadAuditImage(buffer, file.name || "fridge-scan.jpg", mimeType);
      console.log("--> Stored audit image in Vultr Object Storage:", imageUrl);
    } catch (vultrErr) {
      console.warn("Vultr Object Storage upload failed; continuing scan without CDN link:", vultrErr);
    }

    // 4. Extract inventory with Gemini
    const extraction = await parseFridgeImage(buffer, mimeType);

    let pointsAwarded = 0;
    let totalPoints: number | null = null;
    let pointsStatus: "awarded" | "failed" = "failed";

    try {
      const userId = session.user.sub;
      if (!userId) throw new Error("Authenticated Auth0 user ID is missing.");

      const currentPoints = await getUserPoints(userId);
      totalPoints = currentPoints + 100;
      await updateUserPoints(userId, totalPoints);
      pointsAwarded = 100;
      pointsStatus = "awarded";
    } catch (pointsError) {
      // A Management API failure should not discard a successfully parsed scan.
      console.error("Auth0 points update failed:", pointsError);
    }

    // Restock checks still wait until the volunteer confirms and commits the
    // reviewed scan in /api/pantries/[id].
    return NextResponse.json(
      {
        data: extraction,
        imageUrl,
        scannedBy: volunteerEmail,
        timestamp: new Date().toISOString(),
        pointsAwarded,
        totalPoints,
        pointsStatus,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Scan route error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process pantry snapshot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
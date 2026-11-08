import { NextRequest, NextResponse } from "next/server";
import { parseFridgeImage } from "@/features/vision/server/parse-fridge-image";
import { auth0 } from "@/lib/auth0";
import { getUserPoints, updateUserPoints } from "@/lib/auth0-management";

export const maxDuration = 30; // 30-second timeout for image processing

export async function POST(req: NextRequest) {
  console.log("--> /api/scan hit!");
  console.log("--> GEMINI_API_KEY detected:", !!process.env.GEMINI_API_KEY);
  try {
    // 1. Extract verified volunteer session from Auth0
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Volunteer login required." },
        { status: 401 },
      );
    }

    // 2. Parse uploaded scan image payload
    const volunteerEmail = session.user.email;

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Extract inventory with Gemini
    const extraction = await parseFridgeImage(
      buffer,
      file.type || "image/jpeg",
    );

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
        scannedBy: volunteerEmail,
        timestamp: new Date().toISOString(),
        pointsAwarded,
        totalPoints,
        pointsStatus,
      },
      { status: 200 },
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

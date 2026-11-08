import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getUserPoints } from "@/lib/auth0-management";

export async function GET() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const points = await getUserPoints(userId);
    return NextResponse.json({ points }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/points failed:", error);
    return NextResponse.json(
      { error: "Failed to load PantryPulse points from Auth0." },
      { status: 502 },
    );
  }
}

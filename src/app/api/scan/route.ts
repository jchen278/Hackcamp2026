import { NextRequest, NextResponse } from "next/server";
import { parseFridgeImage } from "@/features/vision/server/parse-fridge-image";

export const maxDuration = 30; // 30-second timeout for image processing

export async function POST(req: NextRequest) {
    console.log("--> /api/scan hit!");
  console.log("--> GEMINI_API_KEY detected:", !!process.env.GEMINI_API_KEY);
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extraction = await parseFridgeImage(buffer, file.type || "image/jpeg");

    return NextResponse.json({ data: extraction }, { status: 200 });
  } catch (error: any) {
    console.error("Scan route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process pantry snapshot" },
      { status: 500 }
    );
  }
}
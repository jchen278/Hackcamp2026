import { NextResponse } from "next/server";
import { getPantries } from "@/features/pantries/queries";

export async function GET() {
  try {
    const pantries = await getPantries();
    return NextResponse.json({ data: pantries }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/pantries failed:", err);
    return NextResponse.json({ error: "Failed to fetch pantries" }, { status: 500 });
  }
}
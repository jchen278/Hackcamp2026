import { NextResponse } from "next/server";
import { getPantries, createPantry } from "@/features/pantries/queries";

export async function GET() {
  try {
    const pantries = await getPantries();
    return NextResponse.json({ data: pantries }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/pantries failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch pantries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, address, latitude, longitude } = body;

    // Basic validation
    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Name and address are required fields." },
        { status: 400 }
      );
    }

    const newPantry = await createPantry({
      id,
      name,
      address,
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
    });

    return NextResponse.json({ data: newPantry }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/pantries failed:", err);
    return NextResponse.json(
      { error: "Failed to create pantry location." },
      { status: 500 }
    );
  }
}
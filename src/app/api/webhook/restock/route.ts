import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const webhookUrl = process.env.N8N_RESTOCK_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "N8N_RESTOCK_WEBHOOK_URL environment variable is not configured" },
        { status: 500 }
      );
    }

    const payload = await req.json();

    // Forward low-stock event payload to n8n production webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status ${response.status}`);
    }

    return NextResponse.json(
      { success: true, message: "Restock alert dispatched to n8n successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Restock webhook dispatch error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch restock alert" },
      { status: 500 }
    );
  }
}
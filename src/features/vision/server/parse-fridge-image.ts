import { FridgeScanResponseSchema, type FridgeScanResponse } from "../types";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert civic food security assistant auditing community fridge and pantry shelves in Metro Vancouver.
Analyze the image of the pantry/fridge interior and output a strict JSON object following this format:
- capacityEstimatePct: integer (0-100) estimating how full the fridge/shelf is.
- cleanlinessScore: one of ["clean", "moderate", "needs_attention"].
- items: array of detected items. Each item must have:
  - name: clear standardized grocery name (e.g., "Canned Diced Tomatoes", "Whole Milk")
  - category: one of ["canned_goods", "fresh_produce", "dairy_and_eggs", "prepared_meals", "bakery", "dry_staples", "beverages", "hygiene", "other"]
  - estimatedQuantity: integer count of visible units
  - unit: one of ["units", "loaves", "cans", "boxes", "bags", "liters"]
  - isPerishable: boolean (true for fresh meat, dairy, produce, prepared meals, opened items; false for canned goods, dry pasta)
  - needsRemoval: boolean (set to true if food appears visibly spoiled, moldy, leaking, unsealed, or past safety guidelines)
  - notes: brief observation string or null

Group identical items together into a single record with accurate estimatedQuantity. Do not hallucinate items obscured in dark corners.
`;

export async function parseFridgeImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<FridgeScanResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined in process.env");

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = imageBuffer.toString("base64");

  const promptContents = [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ],
    },
  ];

  const callModel = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: promptContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        temperature: 0.1,
      },
    });
  };

  let response;
  try {
    // Primary: ultra-fast, high-availability model (~2-3s)
    response = await callModel("gemini-3.5-flash-lite");
  } catch (err) {
    console.warn("gemini-3.5-flash-lite busy, falling back to gemini-3.8-flash...", err);
    // Fallback: flagship model with minimal thinking
    response = await callModel("gemini-3.8-flash");
  }

  const rawText = response.text;
  if (!rawText) throw new Error("No output returned from Gemini.");

  return FridgeScanResponseSchema.parse(JSON.parse(rawText));
}
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CATEGORIES, type Category } from "@/lib/inventory";
import { findPantry, toPantryInventory } from "@/lib/pantry-api";

const scanItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(CATEGORIES as [Category, ...Category[]]),
  estimatedQuantity: z.number().int().min(0).max(100_000),
  unit: z.string().trim().min(1).max(40),
  isPerishable: z.boolean(),
  needsRemoval: z.boolean(),
  notes: z.string().max(500).default(""),
});

const commitSchema = z.object({
  scan: z.object({
    capacityEstimatePct: z.number().min(0).max(100),
    cleanlinessScore: z.number().min(0).max(5),
    items: z.array(scanItemSchema).max(200),
  }),
});

// GET /api/pantries/:id — public inventory for one pantry.
// POST /api/pantries/:id — commit an audited inventory scan.
export const Route = createFileRoute("/api/pantries/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const pantry = findPantry(params.id);
        if (!pantry) return Response.json({ error: "Pantry not found" }, { status: 404 });
        return Response.json({ data: toPantryInventory(pantry) });
      },
      POST: async ({ request, params }) => {
        const pantry = findPantry(params.id);
        if (!pantry) return Response.json({ error: "Pantry not found" }, { status: 404 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const parsed = commitSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid scan payload", issues: parsed.error.issues }, { status: 400 });
        }
        // Demo only: the audited commit is validated but never persisted, matching the
        // human-in-the-loop rule that public inventory changes only after admin approval.
        return Response.json({ success: true, demo: true });
      },
    },
  },
});

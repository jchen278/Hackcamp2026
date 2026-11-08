import { createFileRoute } from "@tanstack/react-router";
import { listPantries } from "@/lib/pantry-api";

// GET /api/pantries — public map & directory data, no PII.
export const Route = createFileRoute("/api/pantries/")({
  server: {
    handlers: {
      GET: async () => Response.json({ data: listPantries() }),
    },
  },
});

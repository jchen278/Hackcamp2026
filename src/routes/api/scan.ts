import { createFileRoute } from "@tanstack/react-router";
import { mockFridgeScan } from "@/lib/pantry-api";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// POST /api/scan — multimodal fridge scan (mock Gemini vision). Nothing is stored.
export const Route = createFileRoute("/api/scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Expected multipart FormData" }, { status: 400 });
        }
        const image = form.get("image");
        if (!(image instanceof File) || image.size === 0) {
          return Response.json({ error: "FormData must include an image file" }, { status: 400 });
        }
        if (!image.type.startsWith("image/")) {
          return Response.json({ error: "Uploaded file must be an image" }, { status: 400 });
        }
        if (image.size > MAX_IMAGE_BYTES) {
          return Response.json({ error: "Image too large (max 10 MB)" }, { status: 413 });
        }
        return Response.json({ data: mockFridgeScan() });
      },
    },
  },
});

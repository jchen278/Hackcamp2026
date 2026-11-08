# AGENTS.md — PantryPulse Core Development Guide

PantryPulse is a decentralized mutual-aid inventory and redistribution system for community fridges and micro-pantries across Metro Vancouver. It uses multimodal vision (Gemini API) to transform 5-second camera snapshots of fridge shelves into structured relational inventory in Tiger Data (PostgreSQL), automatically triggering restock webhooks via n8n to volunteer networks on Discord/Telegram when staples run low.

---

## 1. System Architecture & Tech Stack

```text
[ Mobile / Web Client ]
  Next.js 15 (React 19, Tailwind, shadcn) ──► Camera Capture / Image Upload
                                                     │
                                               Multipart Form / Base64
                                                     ▼
[ Vision & Extraction Pipeline ]
  Gemini 1.5/2.0 API (Structured JSON Schema) ──► Validates against Zod schema
                                                     │
                                               Parsed Inventory Records
                                                     ▼
[ Operational Backend ]
  Tiger Data (PostgreSQL) ─────────────────────► Updates fridge inventory & check-in log
                                                     │
                                               Low-Stock Event Trigger
                                                     ▼
[ Notification Engine ]
  n8n Webhook Pipeline ────────────────────────► Discord / Telegram Volunteer Channels

```
### Stack & Sponsor Constraints
- Frontend Framework: Next.js (App Router, Server Actions, React 19), TypeScript 5.x (Strict mode).
- Styling & UI: Tailwind CSS, shadcn/ui, Lucide React icons.
- Authentication: Auth0 (@auth0/nextjs-auth0) for volunteer/admin roles.
- Vision Model: Gemini API (@google/genai or @google/generative-ai) enforcing strict structured output JSON.
- Operational Database: Tiger Data (Managed PostgreSQL via pg connection pool or Drizzle/Prisma).
- Workflow Automation: n8n Webhook endpoints for automated dispatching.
- Package Manager: npm exclusively (npm install, npm dev, npm build).

## 2. Core Domain Invariants & Zero-Tolerance Rules
**Deterministic Structured Vision:** Calls to the Gemini API MUST use responseMimeType: "application/json" with an explicit JSON response schema. Never accept unvalidated freeform markdown or text descriptions from the vision model.

**Perishable Safety Tagging:** Every identified item must be categorized as either perishable: true (dairy, prepared meals, produce, open items) or perishable: false (canned goods, dry pasta, unopened sealed pantry staples). Flag any visibly spoiled or expired food immediately with needsRemoval: true.

**Optimistic Updates & Offline Tolerance:** Fridge scans often happen in dead cellular zones. The frontend must accept photo captures locally, queue them, and provide visual progress feedback without freezing the UI.

**No Direct Secret Exposure:** Never expose Gemini API keys, Tiger Data database credentials, or n8n webhook URLs in client-facing components. All external API calls must execute in Server Components, Server Actions, or Route Handlers (src/app/api/*).

**Role-Based Permissions (Auth0):**
- Public / Anonymous: View live pantry map, check current inventory, view urgent needs.
- Volunteer / Contributor: Upload scan photos, verify item counts, trigger manual restock alerts.
- Admin: Add/edit pantry locations, configure n8n alert thresholds.

## 3. Directory Layout & Module Ownership

The codebase is built on Next.js 16 (App Router) using React 19, Auth0 middleware proxying, Tiger Data (PostgreSQL), and Gemini multimodal vision.

```text
src/
├── app/
│   ├── admin/
│   │   └── page.tsx                  # Volunteer/admin management & threshold controls
│   ├── api/
│   │   ├── pantries/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts          # GET: Fetch pantry inventory | POST: Commit verified scan & trigger n8n alert
│   │   │   └── route.ts              # GET: List active pantries from Tiger Data
│   │   └── scan/
│   │       └── route.ts              # POST: Accept image multipart, run Gemini extraction pipeline
│   ├── favicon.ico
│   ├── globals.css                   # Global styles & Tailwind CSS configuration
│   ├── layout.tsx                    # Root layout with Auth0 provider & navigation shell
│   ├── page.tsx                      # Landing page: community map & fridge finder
│   └── scan/
│       └── page.tsx                  # Volunteer scan & review page
├── assets/                           # Static imagery & demo assets
│   ├── community-garden.jpg
│   └── garden-harvest.jpg.asset.json
├── components/
│   ├── ui/                           # shadcn/ui primitives (dialog, button, table, sheet, drawer, select, etc.)
│   ├── AddFridgeLocation.tsx         # Modal dialog / form to propose and add a community fridge
│   ├── FridgeLocator.tsx             # Interactive Leaflet map, fridge directory, and search interface
│   ├── InventoryReview.tsx           # Item verification table, editable counts, and manual override drawer
│   └── PhotoUpload.tsx               # Drag-and-drop / mobile camera image upload interface
├── features/
│   ├── pantries/
│   │   └── queries.ts                # Tiger Data SQL queries (getPantries, getPantryInventory, commitScanResult)
│   └── vision/
│       ├── server/
│       │   └── parse-fridge-image.ts # Multimodal Gemini API parsing & structured Zod validation
│       └── types.ts                  # Vision schema definitions (ExtractedItemSchema, FoodCategoryEnum)
├── hooks/
│   └── use-mobile.tsx                # Responsive breakpoint detection hook
├── lib/
│   ├── mocks/
│   │   ├── fridge_test_1.jpg         # Sample test fridge snapshot for vision testing
│   │   └── sample-scan-result.ts     # Sample Gemini structured output for offline UI work
│   ├── auth0.ts                      # Auth0 client configuration & session helper
│   ├── db.ts                         # Tiger Data PostgreSQL connection pool singleton
│   ├── fridge-locations.ts           # Client reactive store for fridge locations & user-drafted locations
│   ├── inventory-submission.ts       # Review validation & pending submission generator
│   ├── inventory.ts                  # Categories, SAMPLE_FRIDGES seed data, domain item & fridge types
│   └── utils.ts                      # cn() class helper & relative timestamp formatters
├── types/
│   └── pantry.ts                     # Shared domain models (PantryLocation, InventoryItem, RestockAlertPayload)
├── proxy.ts                          # Next.js 16 Auth0 middleware proxy layer
└── styles.css                        # App design system & custom utility styles
```

### Module Responsibilities

1. **Next.js 16 Proxy Layer (`src/proxy.ts`):**
   - Implements Auth0 session and edge routing using Next.js 16's `proxy` export (replacing deprecated `middleware.ts`).

2. **Frontend UI Components (`src/components/` & `src/app/`):**
   - Interactive components (`FridgeLocator.tsx`, `PhotoUpload.tsx`, `InventoryReview.tsx`, `AddFridgeLocation.tsx`) live in `src/components/` alongside `src/components/ui/` shadcn primitives.
   - Client-side leaf components manage local state and interaction (drag/drop upload, review drawer, Leaflet map), while App Router pages (`page.tsx`, `scan/page.tsx`, `admin/page.tsx`) handle auth session gating and server context.

3. **Operational Database & Vision Pipeline (`src/features/`):**
   - `src/features/pantries/queries.ts` provides transactional database queries to update pantry capacity, write audit logs (`scan_audit_logs`), and synchronize inventory items (`pantry_inventory`).
   - `src/features/vision/server/parse-fridge-image.ts` invokes Gemini 2.5 Flash enforcing structured Zod extraction output (`FridgeScanResponseSchema`).

4. **Domain Types & Local State (`src/types/` & `src/lib/`):**
   - `src/types/pantry.ts` defines database-aligned interfaces (`PantryLocation`, `InventoryItem`, `RestockAlertPayload`).
   - `src/lib/inventory.ts`, `src/lib/fridge-locations.ts`, and `src/lib/inventory-submission.ts` provide reactive client stores, validation, and seed data (`SAMPLE_FRIDGES`).

## 4. Operational Guardrails for AI Agents
**TypeScript Verification**: Always verify changes by running npm tsc --noEmit. Never mark a task as complete if type errors remain.

**Component Boundaries**:

Keep data-fetching pages and API routes as Server Components.

Push 'use client' strictly to interactive leaves: camera capture (`PhotoUpload.tsx` / `camera-capture.tsx`), interactive item edit drawers (`InventoryReview.tsx`), and Leaflet map controls (`FridgeLocator.tsx`).

Atomic Edits: Never rewrite entire files to add a single feature, field, or utility function. Make targeted modifications.

Dependency Discipline: Reuse existing packages (lucide-react, zod, @google/genai, leaflet, react-leaflet). Do not introduce secondary HTTP clients (use native fetch) or state managers when React hooks suffice.

Zero SQL Injection: All PostgreSQL queries inside src/features/*/server/ or src/features/pantries/ must use parameterized variables ($1, $2). Never concatenate raw user or LLM strings into SQL queries.

## 5. Schemas & Data Contracts
### A. Gemini Vision Extraction Schema (src/features/vision/types.ts)
```typescript
import { z } from "zod";

export const ExtractedItemSchema = z.object({
  name: z.string().describe("Standardized common food name, e.g., 'Canned Black Beans'"),
  category: z.enum([
    "canned_goods",
    "fresh_produce",
    "dairy_and_eggs",
    "prepared_meals",
    "bakery",
    "dry_staples",
    "beverages",
    "hygiene",
    "other",
  ]),
  estimatedQuantity: z.number().int().min(1).describe("Estimated count of visible units"),
  unit: z.enum(["units", "loaves", "cans", "boxes", "bags", "liters"]),
  isPerishable: z.boolean(),
  needsRemoval: z.boolean().describe("True if item appears spoiled, damaged, or unsealed"),
  notes: z.string().optional().describe("e.g., 'half-full gallon', 'soft bruising'"),
});

export const FridgeScanResponseSchema = z.object({
  capacityEstimatePct: z.number().int().min(0).max(100).describe("Overall fridge fullness 0-100"),
  cleanlinessScore: z.enum(["clean", "moderate", "needs_attention"]),
  items: z.array(ExtractedItemSchema),
});

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type FridgeScanResponse = z.infer<typeof FridgeScanResponseSchema>;
```

### B. Database Schema (Tiger Data / PostgreSQL)
``` SQL
CREATE TABLE pantries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,              -- e.g., 'Little Mountain Community Fridge'
    address TEXT NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    status VARCHAR(32) DEFAULT 'active',      -- 'active', 'under_maintenance', 'inactive'
    capacity_pct INT DEFAULT 0,
    cleanliness VARCHAR(32) DEFAULT 'clean',
    last_scanned_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE pantry_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pantry_id UUID REFERENCES pantries(id) ON DELETE CASCADE,
    item_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit VARCHAR(32) NOT NULL DEFAULT 'units',
    is_perishable BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scan_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pantry_id UUID REFERENCES pantries(id),
    scanned_by_email VARCHAR(255),            -- From Auth0 session
    image_url TEXT,
    raw_ai_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_pantry_category ON pantry_inventory(pantry_id, category);
```

## 6. n8n Automation Contract
When capacity_pct < 20 or critical staples (canned_goods, prepared_meals) reach zero count in a pantry, trigger the n8n dispatch webhook:
- Endpoint: POST ${N8N_RESTOCK_WEBHOOK_URL}
- Payload Structure:
``` JSON
{
  "event": "PANTRY_LOW_STOCK",
  "pantryId": "b8a8b13d-5df7-4b7b-8919-4c8d5c41498b",
  "pantryName": "Little Mountain Community Fridge",
  "address": "Main St & 30th Ave, Vancouver, BC",
  "currentCapacityPct": 15,
  "urgentNeeds": [
    { "category": "canned_goods", "currentQuantity": 0 },
    { "category": "fresh_produce", "currentQuantity": 1 }
  ],
  "timestamp": "2026-11-07T14:30:00Z"
}
```
## 7. Fast Mock Development Strategy
If credentials for Tiger Data, Gemini, or n8n are pending setup during the initial sprint hours, develop against mock datasets and local helpers:

- **`src/lib/inventory.ts` (`SAMPLE_FRIDGES`)**: Contains pre-configured Vancouver community fridge coordinate points (Strathcona, Mount Pleasant, Kitsilano, Commercial Drive) for immediate Leaflet map rendering. (To be extracted into `src/lib/mocks/sample-pantries.ts`).
- **`src/lib/mocks/sample-scan-result.ts` & `fridge_test_1.jpg`**: Provides realistic pre-baked Gemini responses across categories alongside sample imagery, enabling complete UI development of the review drawer and inventory views without live API calls.
- **`src/lib/inventory-submission.ts`**: Provides validation (`validReviewItems`) and mock proposal generators for offline review testing.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

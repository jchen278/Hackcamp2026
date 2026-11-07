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
```text
src/
├── app/
│   ├── api/
│   │   ├── pantries/
│   │   │   ├── route.ts              # GET: List active community pantries & status
│   │   │   └── [id]/route.ts          # GET/PATCH: Single pantry details & inventory
│   │   ├── scan/route.ts             # POST: Accept image, run Gemini extraction, write DB
│   │   └── webhook/restock/route.ts  # POST: Relay depleted inventory events to n8n
│   ├── layout.tsx                    # Root layout with Auth0 provider & navigation
│   ├── page.tsx                      # Public map & pantry status directory
│   ├── scan/page.tsx                 # Mobile camera capture interface
│   └── admin/page.tsx                # Inventory thresholds & volunteer management
├── components/
│   ├── common/                       # Navbar, StatusBadge, QuantityIndicator
│   ├── pantry/
│   │   ├── pantry-card.tsx           # Summary card for map popups and list views
│   │   ├── inventory-list.tsx        # Categorized item table with expiry flags
│   │   └── low-stock-alert.tsx       # Urgent restock banner component
│   ├── scan/
│   │   ├── camera-capture.tsx        # 'use client' live video stream / snapshot trigger
│   │   └── scan-confirmation.tsx     # Review extracted items before saving to DB
│   └── ui/                           # shadcn/ui primitives (dialog, button, table, badge)
├── features/
│   ├── vision/
│   │   ├── server/
│   │   │   ├── gemini.ts             # Gemini client & structured prompt definitions
│   │   │   └── parse-fridge-image.ts # Multipart processing & schema validation
│   │   └── types.ts                  # Raw and sanitized vision extraction types
│   ├── inventory/
│   │   ├── server/                   # Tiger Data SQL queries (inventory updates, logs)
│   │   └── types.ts                  # InventoryItem, Category, StockLevel types
│   └── alerts/
│       └── server/                   # n8n webhook dispatcher (low stock / cleanup alerts)
├── lib/
│   ├── db.ts                         # Tiger Data Postgres connection pool singleton
│   ├── auth0.ts                      # Auth0 session helper
│   ├── utils.ts                      # cn() class helper & relative timestamp formatters
│   └── mocks/
│       ├── sample-pantries.ts        # Seed Vancouver community fridges
│       └── sample-scan-result.ts     # Sample Gemini structured output for offline UI work
└── types/
    ├── database.ts                   # Strongly-typed tables from Tiger Data
    └── api.ts                        # Standard API response envelopes: { data, error }
```

## 4. Operational Guardrails for AI Agents
**TypeScript Verification**: Always verify changes by running npm tsc --noEmit. Never mark a task as complete if type errors remain.

**Component Boundaries**:

Keep data-fetching pages and API routes as Server Components.

Push 'use client' strictly to interactive leaves: camera capture (camera-capture.tsx), interactive item edit drawers, and confirmation modals.

Atomic Edits: Never rewrite entire files to add a single feature, field, or utility function. Make targeted modifications.

Dependency Discipline: Reuse existing packages (lucide-react, zod, @google/genai). Do not introduce secondary HTTP clients (use native fetch) or state managers when React hooks suffice.

Zero SQL Injection: All PostgreSQL queries inside src/features/*/server/ must use parameterized variables ($1, $2). Never concatenate raw user or LLM strings into SQL queries.

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
If credentials for Tiger Data, Gemini, or n8n are pending setup during the initial sprint hours, develop against src/lib/mocks/:

src/lib/mocks/sample-pantries.ts: Contains real Vancouver community fridge coordinate points (e.g., Mount Pleasant Fridge at 7th & Quebec, Downtown Eastside Kitchen Tables, Commercial Drive Community Hub).

src/lib/mocks/sample-scan-result.ts: Provides pre-baked Gemini responses returning 8–12 realistic items across different categories, enabling complete UI development of the review drawer and inventory views before touching the live camera or external APIs.
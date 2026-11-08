import { query, pool } from "@/lib/db";
import { PantryLocation, InventoryItem } from "@/types/pantry";
import { FridgeScanResponse } from "@/features/vision/types";

export interface LiveFridge {
  id: string;
  name: string;
  address: string;
  neighbourhood?: string | null;
  coordinates?: [number, number] | null;
  status?: "active" | "needs_attention" | "empty";
  capacityPct?: number;
  cleanliness?: string;
  inventory: Array<{
    name: string;
    category: string;
    quantity: number;
    unit?: string;
  }>;
}

// 1. Fetch all pantry locations (Fixed table name: pantry_locations)
export async function getPantries(): Promise<PantryLocation[]> {
  const result = await query<PantryLocation>(`
    SELECT 
      id, 
      name, 
      address, 
      latitude, 
      longitude, 
      status, 
      capacity_pct AS "capacityPct", 
      cleanliness, 
      last_scanned_at AS "lastScannedAt"
    FROM pantry_locations
    ORDER BY name ASC;
  `);
  return result.rows;
}

// 2. Fetch inventory for a specific pantry
export async function getPantryInventory(pantryId: string): Promise<InventoryItem[]> {
  const result = await query<InventoryItem>(
    `
    SELECT 
      id, 
      pantry_id AS "pantryId", 
      item_name AS "name", 
      category, 
      quantity, 
      unit, 
      is_perishable AS "isPerishable", 
      updated_at AS "updatedAt"
    FROM pantry_inventory
    WHERE pantry_id = $1
    ORDER BY category ASC, item_name ASC;
  `,
    [pantryId]
  );
  return result.rows;
}

// 3. Fetch all fridges with nested live inventory for the Home Page & Map
export async function getFridgesWithInventory(): Promise<LiveFridge[]> {
  const result = await query<any>(`
    SELECT 
      p.id,
      p.name,
      p.address,
      p.neighbourhood,
      p.latitude,
      p.longitude,
      p.capacity_pct,
      p.cleanliness,
      COALESCE(
        json_agg(
          json_build_object(
            'name', i.item_name,
            'category', i.category,
            'quantity', i.quantity,
            'unit', i.unit
          )
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'
      ) AS inventory
    FROM pantry_locations p
    LEFT JOIN pantry_inventory i ON p.id = i.pantry_id
    GROUP BY p.id
    ORDER BY p.name ASC;
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    neighbourhood: row.neighbourhood,
    coordinates:
      row.latitude && row.longitude
        ? [parseFloat(row.latitude), parseFloat(row.longitude)]
        : null,
    capacityPct: row.capacity_pct ?? 0,
    cleanliness: row.cleanliness ?? "clean",
    status: (row.capacity_pct ?? 0) < 20 ? "empty" : "active",
    inventory: row.inventory ?? [],
  }));
}

// 4. Commit verified scan to Tiger Data
export async function commitScanResult(
  pantryId: string, 
  scan: FridgeScanResponse,
  metadata?: { scannedByEmail?: string; imageUrl?: string }
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // A. Update current capacity and cleanliness on pantry_locations
    await client.query(
      `
      UPDATE pantry_locations
      SET 
        capacity_pct = $1,
        cleanliness = $2,
        last_scanned_at = NOW()
      WHERE id = $3;
      `,
      [scan.capacityEstimatePct, scan.cleanlinessScore, pantryId]
    );

    // B. Write to scan_audit_logs matching teammate's schema
    await client.query(
      `
      INSERT INTO scan_audit_logs (
        pantry_id, 
        scanned_by_email, 
        image_url, 
        raw_ai_payload, 
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW());
      `,
      [
        pantryId,
        metadata?.scannedByEmail ?? null,
        metadata?.imageUrl ?? null,
        JSON.stringify(scan),
      ]
    );

    // C. Reconcile pantry inventory: wipe old and write active items
    await client.query(`DELETE FROM pantry_inventory WHERE pantry_id = $1;`, [pantryId]);

    for (const item of scan.items) {
      // Exclude spoiled/unsuitable items flagged by Gemini
      if (item.needsRemoval) continue;

      await client.query(
        `
        INSERT INTO pantry_inventory (
          pantry_id, 
          item_name, 
          category, 
          quantity, 
          unit, 
          is_perishable, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW());
        `,
        [
          pantryId,
          item.name,
          item.category,
          item.estimatedQuantity,
          item.unit,
          item.isPerishable,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
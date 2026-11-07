import { query, pool } from "@/lib/db";
import { PantryLocation, InventoryItem } from "@/types/pantry";
import { FridgeScanResponse } from "@/features/vision/types";

// 1. Fetch all pantry locations
export async function getPantries(): Promise<PantryLocation[]> {
  const result = await query(`
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
    FROM pantries
    ORDER BY name ASC;
  `);
  return result.rows;
}

// 2. Fetch inventory for a specific pantry
export async function getPantryInventory(pantryId: string): Promise<InventoryItem[]> {
  const result = await query(
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

// 3. Commit verified scan to Tiger Data
export async function commitScanResult(
  pantryId: string, 
  scan: FridgeScanResponse,
  metadata?: { scannedByEmail?: string; imageUrl?: string }
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // A. Update current capacity and cleanliness on the pantry record
    await client.query(
      `
      UPDATE pantries
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
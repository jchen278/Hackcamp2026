const { Pool } = require("pg");
const fs = require("fs");

let conn = process.env.DATABASE_URL;
if (fs.existsSync(".env")) {
  const match = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) conn = match[1];
}

const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

async function verifyLatest() {
  console.log("\n=================== 1. LATEST AUDIT LOG ===================");
  const audit = await pool.query(`
    SELECT id, pantry_id, scanned_by_email, image_url, created_at
    FROM scan_audit_logs
    ORDER BY created_at DESC
    LIMIT 1;
  `);
  console.table(audit.rows);

  if (audit.rows.length > 0) {
    const pantryId = audit.rows[0].pantry_id;
    console.log("\n=================== 2. UPDATED PANTRY ===================");
    const pantry = await pool.query(`
      SELECT id, name, capacity_pct, cleanliness, last_scanned_at
      FROM pantries
      WHERE id = $1;
    `, [pantryId]);
    console.table(pantry.rows);

    console.log("\n=================== 3. RECONCILED INVENTORY ===================");
    const inv = await pool.query(`
      SELECT item_name, category, quantity, unit, is_perishable, updated_at
      FROM pantry_inventory
      WHERE pantry_id = $1
      ORDER BY updated_at DESC
      LIMIT 10;
    `, [pantryId]);
    console.table(inv.rows);
  }

  await pool.end();
}

verifyLatest().catch((err) => {
  console.error("Verification failed:", err);
  pool.end();
});
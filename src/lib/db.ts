import { Pool } from "pg";

const globalForDb = globalThis as unknown as { connPool: Pool | undefined };

export const pool =
  globalForDb.connPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Explicitly allow cloud-hosted Postgres self-signed certificate chains
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.connPool = pool;
}

export async function query<T = any>(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development") {
    console.log("Executed query", { text: text.slice(0, 80), duration, rows: res.rowCount });
  }
  return res;
}
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { transaction } from "./db.ts";
export async function migrateTestDatabase(pool: Pool, opts: { productionSetup?: boolean } = {}) {
  const result = await pool.query("SELECT current_database() AS name");
  if (!opts.productionSetup && !String(result.rows[0].name).endsWith("_test"))
    throw new Error("TEST_DATABASE_REQUIRED");
  for (const file of (await readdir("db/migrations"))
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort()) {
    const sql = await readFile(`db/migrations/${file}`, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    await transaction(pool, async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(79421036)");
      await client.query("CREATE SCHEMA IF NOT EXISTS operations");
      await client.query("REVOKE ALL ON SCHEMA operations FROM PUBLIC");
      await client.query(
        "CREATE TABLE IF NOT EXISTS operations.schema_migrations(name text PRIMARY KEY,checksum char(64) NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
      );
      await client.query(
        "REVOKE ALL ON operations.schema_migrations FROM PUBLIC",
      );
      const existing = await client.query(
        "SELECT checksum FROM operations.schema_migrations WHERE name=$1",
        [file],
      );
      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum)
          throw new Error("MIGRATION_CHECKSUM_MISMATCH");
        return;
      }
      await client.query(
        sql.replace(/^BEGIN;\s*$/gm, "").replace(/^COMMIT;\s*$/gm, ""),
      );
      await client.query(
        "INSERT INTO operations.schema_migrations(name,checksum) VALUES($1,$2)",
        [file, checksum],
      );
    });
  }
}

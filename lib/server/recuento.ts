import type { Pool } from "pg";
import type { RecuentoPayload } from "../election-night.ts";

/**
 * Una única fila con el último recuento oficial cargado por el operador.
 * No contiene datos personales.
 */
export const RECUENTO_ID = "congreso-2026-11-29";
export const RECUENTO_SCHEMA_SQL = [
  "CREATE SCHEMA IF NOT EXISTS poll_private",
  `CREATE TABLE IF NOT EXISTS poll_private.election_night (
    id text PRIMARY KEY,
    payload jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now())`,
  "ALTER TABLE poll_private.election_night ENABLE ROW LEVEL SECURITY",
  "REVOKE ALL ON poll_private.election_night FROM PUBLIC",
];

const g = globalThis as typeof globalThis & { __recuentoSchema?: WeakMap<Pool, Promise<void>> };
export function ensureRecuentoSchema(pool: Pool): Promise<void> {
  g.__recuentoSchema ??= new WeakMap();
  let ready = g.__recuentoSchema.get(pool);
  if (!ready) {
    ready = (async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(79421038)");
        for (const statement of RECUENTO_SCHEMA_SQL) await client.query(statement);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    })();
    ready.catch(() => g.__recuentoSchema?.delete(pool));
    g.__recuentoSchema.set(pool, ready);
  }
  return ready;
}

export async function readRecuento(pool: Pool): Promise<RecuentoPayload | null> {
  await ensureRecuentoSchema(pool);
  const r = await pool.query<{ payload: RecuentoPayload }>(
    "SELECT payload FROM poll_private.election_night WHERE id=$1", [RECUENTO_ID]);
  return r.rows[0]?.payload ?? null;
}

export async function saveRecuento(pool: Pool, payload: RecuentoPayload): Promise<void> {
  await ensureRecuentoSchema(pool);
  await pool.query(
    `INSERT INTO poll_private.election_night(id,payload,updated_at) VALUES($1,$2,now())
     ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=now()`,
    [RECUENTO_ID, JSON.stringify(payload)],
  );
}

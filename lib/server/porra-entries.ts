import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { Pool } from "pg";
import {
  PORRA_RANKING_FROM, cleanAlias, decodePrediction, encodePrediction, isPorraOpen, rankEntries,
  type Prediction, type RankedEntry,
} from "../porra.ts";

/**
 * Porras apuntadas para la clasificación. Cada navegador (credencial anónima)
 * apunta una sola porra y puede cambiarla hasta el cierre. Se guarda el apodo
 * y la porra; la IP y el navegador solo como HMAC. Nada se publica antes de
 * PORRA_RANKING_FROM, y nunca se publican sumas ni medias de porras.
 */
export const PORRA_ID = "congreso-2026-11-29";
export const porraLimits = Object.freeze({ perIpWindow: 5, ipWindowSeconds: 3600 });

export const PORRA_SCHEMA_SQL = [
  "CREATE SCHEMA IF NOT EXISTS poll_private",
  `CREATE TABLE IF NOT EXISTS poll_private.porra_entries (
    porra_id text NOT NULL,
    browser_digest char(64) NOT NULL CHECK (browser_digest ~ '^[a-f0-9]{64}$'),
    alias text NOT NULL CHECK (char_length(alias) BETWEEN 2 AND 24),
    code text NOT NULL CHECK (char_length(code) <= 300),
    hidden boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (porra_id, browser_digest))`,
  "CREATE UNIQUE INDEX IF NOT EXISTS porra_entries_alias_idx ON poll_private.porra_entries (porra_id, lower(alias))",
  `CREATE TABLE IF NOT EXISTS poll_private.porra_ip_window (
    porra_id text NOT NULL,
    ip_digest char(64) NOT NULL CHECK (ip_digest ~ '^[a-f0-9]{64}$'),
    hit_at timestamptz NOT NULL DEFAULT now())`,
  "CREATE INDEX IF NOT EXISTS porra_ip_window_digest_idx ON poll_private.porra_ip_window (porra_id, ip_digest, hit_at)",
  "ALTER TABLE poll_private.porra_entries ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE poll_private.porra_ip_window ENABLE ROW LEVEL SECURITY",
  "REVOKE ALL ON poll_private.porra_entries, poll_private.porra_ip_window FROM PUBLIC",
];

const g = globalThis as typeof globalThis & { __porraSchema?: WeakMap<Pool, Promise<void>> };
export function ensurePorraSchema(pool: Pool): Promise<void> {
  g.__porraSchema ??= new WeakMap();
  let ready = g.__porraSchema.get(pool);
  if (!ready) {
    ready = (async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(79421039)");
        for (const statement of PORRA_SCHEMA_SQL) await client.query(statement);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    })();
    ready.catch(() => g.__porraSchema?.delete(pool));
    g.__porraSchema.set(pool, ready);
  }
  return ready;
}

function hmac(secret: string, scope: string, value: string) {
  return createHmac("sha256", secret).update(`porra:${PORRA_ID}:${scope}`).update("\0").update(value).digest("hex");
}

export type PorraEntryInput = { alias: unknown; code: unknown; browserToken: string; ip: string };
export type PorraSaveResult =
  | { accepted: true; code: "RECORDED" | "UPDATED"; alias: string; prediction: string }
  | { accepted: false; code: "CLOSED" | "INVALID_ALIAS" | "INVALID_PREDICTION" | "INVALID_TOKEN" | "INVALID_CLIENT" | "ALIAS_TAKEN" }
  | { accepted: false; code: "IP_WINDOW_LIMIT"; retryAfterSeconds: number };

export async function savePorraEntry(pool: Pool, secret: string, input: PorraEntryInput, now = new Date()): Promise<PorraSaveResult> {
  if (secret.length < 32) throw new Error("HMAC_SECRET_REQUIRED");
  if (!isPorraOpen(now)) return { accepted: false, code: "CLOSED" };
  const alias = cleanAlias(input.alias);
  if (!alias) return { accepted: false, code: "INVALID_ALIAS" };
  const p = typeof input.code === "string" ? decodePrediction(input.code) : null;
  if (!p) return { accepted: false, code: "INVALID_PREDICTION" };
  if (!/^[a-f0-9]{64}$/.test(input.browserToken)) return { accepted: false, code: "INVALID_TOKEN" };
  if (isIP(input.ip) === 0) return { accepted: false, code: "INVALID_CLIENT" };
  await ensurePorraSchema(pool);
  const code = encodePrediction(p);
  const browserHash = hmac(secret, "browser", input.browserToken);
  const ipHash = hmac(secret, "ip", input.ip);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const key of [ipHash, browserHash, `alias:${alias.toLowerCase()}`].sort())
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [key]);
    const taken = await client.query(
      "SELECT 1 FROM poll_private.porra_entries WHERE porra_id=$1 AND lower(alias)=lower($2) AND browser_digest<>$3",
      [PORRA_ID, alias, browserHash]);
    if (taken.rowCount) { await client.query("ROLLBACK"); return { accepted: false, code: "ALIAS_TAKEN" }; }
    const mine = await client.query("SELECT 1 FROM poll_private.porra_entries WHERE porra_id=$1 AND browser_digest=$2", [PORRA_ID, browserHash]);
    if (mine.rowCount) {
      await client.query(
        "UPDATE poll_private.porra_entries SET alias=$3, code=$4, updated_at=now() WHERE porra_id=$1 AND browser_digest=$2",
        [PORRA_ID, browserHash, alias, code]);
      await client.query("COMMIT");
      return { accepted: true, code: "UPDATED", alias, prediction: code };
    }
    // Solo las porras nuevas cuentan para el límite por conexión.
    await client.query(
      "DELETE FROM poll_private.porra_ip_window WHERE porra_id=$1 AND ip_digest=$2 AND hit_at <= now() - make_interval(secs => $3)",
      [PORRA_ID, ipHash, porraLimits.ipWindowSeconds]);
    const window = await client.query<{ used: number; retry: number | null }>(
      `SELECT count(*)::int AS used,
              ceil(extract(epoch FROM min(hit_at) + make_interval(secs => $3) - now()))::int AS retry
         FROM poll_private.porra_ip_window WHERE porra_id=$1 AND ip_digest=$2`,
      [PORRA_ID, ipHash, porraLimits.ipWindowSeconds]);
    if (window.rows[0].used >= porraLimits.perIpWindow) {
      await client.query("ROLLBACK");
      return { accepted: false, code: "IP_WINDOW_LIMIT", retryAfterSeconds: Math.max(1, window.rows[0].retry ?? 1) };
    }
    await client.query("INSERT INTO poll_private.porra_ip_window(porra_id,ip_digest) VALUES($1,$2)", [PORRA_ID, ipHash]);
    await client.query(
      "INSERT INTO poll_private.porra_entries(porra_id,browser_digest,alias,code) VALUES($1,$2,$3,$4)",
      [PORRA_ID, browserHash, alias, code]);
    await client.query("COMMIT");
    return { accepted: true, code: "RECORDED", alias, prediction: code };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** La porra apuntada desde este navegador (solo se devuelve a ese navegador). */
export async function readMyPorra(pool: Pool, secret: string, browserToken: string): Promise<{ alias: string; code: string } | null> {
  if (!/^[a-f0-9]{64}$/.test(browserToken)) return null;
  await ensurePorraSchema(pool);
  const r = await pool.query<{ alias: string; code: string }>(
    "SELECT alias, code FROM poll_private.porra_entries WHERE porra_id=$1 AND browser_digest=$2",
    [PORRA_ID, hmac(secret, "browser", browserToken)]);
  return r.rows[0] ?? null;
}

/** Todas las porras, puntuadas si ya hay recuento. Vacía antes de que acabe la veda. */
export async function readPorraRanking(pool: Pool, actual: Prediction | null, now = new Date()): Promise<RankedEntry[]> {
  if (now < PORRA_RANKING_FROM) return [];
  await ensurePorraSchema(pool);
  const r = await pool.query<{ alias: string; code: string; at: Date }>(
    "SELECT alias, code, updated_at AS at FROM poll_private.porra_entries WHERE porra_id=$1 AND NOT hidden",
    [PORRA_ID]);
  return rankEntries(r.rows.map((x) => ({ alias: x.alias, code: x.code, at: new Date(x.at).toISOString() })), actual);
}

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { Pool } from "pg";
import {
  DEBATE_ID,
  DEBATE_VOTE_CLOSES_AT,
  debatePercentages,
  isDebateOption,
  isDebateVoteOpen,
  type DebateShares,
} from "../debate.ts";

/**
 * Límites de la votación del debate: 1 voto por credencial anónima de
 * navegador y como máximo 2 votos por conexión (IP) cada 5 horas, igual que
 * el sondeo principal. Son mitigaciones, no garantías de identidad.
 */
export const debateLimits = Object.freeze({ perIpWindow: 2, ipWindowSeconds: 5 * 3600 });

export type DebateVote = { optionId: string; browserToken: string; ip: string; requestToken: string };
export type DebateSaveResult =
  | { accepted: true; code: "RECORDED" }
  | { accepted: false; code: "CLOSED" | "INVALID_OPTION" | "INVALID_TOKEN" | "INVALID_CLIENT" | "ALREADY_SUBMITTED" | "BROWSER_LIMIT" }
  | { accepted: false; code: "IP_WINDOW_LIMIT"; retryAfterSeconds: number };

/** Misma estructura que db/migrations/0006_debate_vote.sql, sin BEGIN/COMMIT. */
export const DEBATE_SCHEMA_SQL = [
  "CREATE SCHEMA IF NOT EXISTS poll_private",
  `CREATE TABLE IF NOT EXISTS poll_private.debate_counts (
    debate_id text NOT NULL,
    option_id text NOT NULL CHECK (option_id IN ('sanchez','feijoo','abascal','colau','ninguno')),
    n bigint NOT NULL CHECK (n >= 0),
    PRIMARY KEY (debate_id, option_id))`,
  `CREATE TABLE IF NOT EXISTS poll_private.debate_browser (
    debate_id text NOT NULL,
    browser_digest char(64) NOT NULL CHECK (browser_digest ~ '^[a-f0-9]{64}$'),
    PRIMARY KEY (debate_id, browser_digest))`,
  `CREATE TABLE IF NOT EXISTS poll_private.debate_ip_window (
    debate_id text NOT NULL,
    ip_digest char(64) NOT NULL CHECK (ip_digest ~ '^[a-f0-9]{64}$'),
    hit_at timestamptz NOT NULL DEFAULT now())`,
  "CREATE INDEX IF NOT EXISTS debate_ip_window_digest_idx ON poll_private.debate_ip_window (debate_id, ip_digest, hit_at)",
  `CREATE TABLE IF NOT EXISTS poll_private.debate_idempotency (
    debate_id text NOT NULL,
    request_digest char(64) NOT NULL CHECK (request_digest ~ '^[a-f0-9]{64}$'),
    PRIMARY KEY (debate_id, request_digest))`,
  "ALTER TABLE poll_private.debate_counts ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE poll_private.debate_browser ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE poll_private.debate_ip_window ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE poll_private.debate_idempotency ENABLE ROW LEVEL SECURITY",
  `REVOKE ALL ON poll_private.debate_counts, poll_private.debate_browser,
    poll_private.debate_ip_window, poll_private.debate_idempotency FROM PUBLIC`,
];

const g = globalThis as typeof globalThis & { __debateSchema?: WeakMap<Pool, Promise<void>> };
/** Crea las tablas si aún no existen (idempotente, una vez por instancia). */
export function ensureDebateSchema(pool: Pool): Promise<void> {
  g.__debateSchema ??= new WeakMap();
  let ready = g.__debateSchema.get(pool);
  if (!ready) {
    ready = (async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(79421037)");
        for (const statement of DEBATE_SCHEMA_SQL) await client.query(statement);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    })();
    ready.catch(() => g.__debateSchema?.delete(pool));
    g.__debateSchema.set(pool, ready);
  }
  return ready;
}

function hmac(secret: string, scope: string, value: string) {
  return createHmac("sha256", secret).update(`${DEBATE_ID}:${scope}`).update("\0").update(value).digest("hex");
}

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

export async function saveDebateVote(pool: Pool, secret: string, vote: DebateVote, now = new Date()): Promise<DebateSaveResult> {
  if (secret.length < 32) throw new Error("HMAC_SECRET_REQUIRED");
  if (!isDebateVoteOpen(now)) return { accepted: false, code: "CLOSED" };
  if (!isDebateOption(vote.optionId)) return { accepted: false, code: "INVALID_OPTION" };
  if (!/^[a-f0-9]{64}$/.test(vote.browserToken) || !UUID.test(vote.requestToken)) return { accepted: false, code: "INVALID_TOKEN" };
  if (isIP(vote.ip) === 0) return { accepted: false, code: "INVALID_CLIENT" };
  await ensureDebateSchema(pool);
  const ipHash = hmac(secret, "ip", vote.ip);
  const browserHash = hmac(secret, "browser", vote.browserToken);
  const requestHash = hmac(secret, "request", vote.requestToken);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const key of [ipHash, browserHash].sort())
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [key]);
    const seen = await client.query("SELECT 1 FROM poll_private.debate_idempotency WHERE debate_id=$1 AND request_digest=$2", [DEBATE_ID, requestHash]);
    if (seen.rowCount) { await client.query("ROLLBACK"); return { accepted: false, code: "ALREADY_SUBMITTED" }; }
    const already = await client.query("SELECT 1 FROM poll_private.debate_browser WHERE debate_id=$1 AND browser_digest=$2", [DEBATE_ID, browserHash]);
    if (already.rowCount) { await client.query("ROLLBACK"); return { accepted: false, code: "BROWSER_LIMIT" }; }
    await client.query(
      "DELETE FROM poll_private.debate_ip_window WHERE debate_id=$1 AND ip_digest=$2 AND hit_at <= now() - make_interval(secs => $3)",
      [DEBATE_ID, ipHash, debateLimits.ipWindowSeconds],
    );
    const window = await client.query<{ used: number; retry: number | null }>(
      `SELECT count(*)::int AS used,
              ceil(extract(epoch FROM min(hit_at) + make_interval(secs => $3) - now()))::int AS retry
         FROM poll_private.debate_ip_window WHERE debate_id=$1 AND ip_digest=$2`,
      [DEBATE_ID, ipHash, debateLimits.ipWindowSeconds],
    );
    if (window.rows[0].used >= debateLimits.perIpWindow) {
      await client.query("ROLLBACK");
      return { accepted: false, code: "IP_WINDOW_LIMIT", retryAfterSeconds: Math.max(1, window.rows[0].retry ?? 1) };
    }
    await client.query("INSERT INTO poll_private.debate_ip_window(debate_id,ip_digest) VALUES($1,$2)", [DEBATE_ID, ipHash]);
    await client.query("INSERT INTO poll_private.debate_browser(debate_id,browser_digest) VALUES($1,$2)", [DEBATE_ID, browserHash]);
    await client.query(
      `INSERT INTO poll_private.debate_counts(debate_id,option_id,n) VALUES($1,$2,1)
       ON CONFLICT(debate_id,option_id) DO UPDATE SET n=poll_private.debate_counts.n+1`,
      [DEBATE_ID, vote.optionId],
    );
    await client.query("INSERT INTO poll_private.debate_idempotency(debate_id,request_digest) VALUES($1,$2)", [DEBATE_ID, requestHash]);
    await client.query("COMMIT");
    return { accepted: true, code: "RECORDED" };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Lee los contadores y devuelve solo porcentajes: el recuento no sale de aquí. */
export async function readDebateShares(pool: Pool, now = new Date()): Promise<DebateShares> {
  await ensureDebateSchema(pool);
  const r = await pool.query<{ option_id: string; n: string }>(
    "SELECT option_id, n::text AS n FROM poll_private.debate_counts WHERE debate_id=$1",
    [DEBATE_ID],
  );
  const counts = Object.fromEntries(r.rows.map((row) => [row.option_id, Number(row.n)]));
  const { hasVotes, shares } = debatePercentages(counts);
  return { debateId: DEBATE_ID, open: isDebateVoteOpen(now), closesAt: DEBATE_VOTE_CLOSES_AT.toISOString(), hasVotes, shares };
}

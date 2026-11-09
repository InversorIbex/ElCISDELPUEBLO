import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { Pool, PoolClient } from "pg";
import { candidaciesForProvince } from "../candidacies/registry.ts";
export const CAMPAIGN = "congress-2026";
const CONSENT_VERSION = "epov-2026-v1";
/**
 * Promoter policy (2026-11-09): max 2 accepted votes per IP in any 5-hour
 * window (sliding), and 1 vote per anonymous browser credential for the whole
 * campaign. The credential is an HttpOnly cookie: it is NOT a hardware ID and
 * can be reset by clearing cookies; these are mitigations, not identity guarantees.
 */
export const voteLimits = Object.freeze({ perIpWindow: 2, ipWindowSeconds: 5 * 3600, perBrowserCampaign: 1 });
export type Vote = { provinceCode: string; candidacyId: string; browserToken: string; ip: string; requestToken: string };
export type SaveResult =
  | { accepted: true; code: "RECORDED" }
  | { accepted: false; code: "INVALID_CANDIDACY" | "INVALID_TOKEN" | "INVALID_CLIENT" | "ALREADY_SUBMITTED" | "BROWSER_LIMIT" }
  | { accepted: false; code: "IP_WINDOW_LIMIT"; retryAfterSeconds: number };

export function madridCalendarDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const read = (type: string) => parts.find((p) => p.type === type)?.value;
  const [year, month, day] = [read("year"), read("month"), read("day")];
  if (!year || !month || !day) throw new Error("INVALID_CALENDAR_DATE");
  return `${year}-${month}-${day}`;
}
function hmac(secret: string, scope: string, value: string) {
  return createHmac("sha256", secret).update(scope).update("\0").update(value).digest("hex");
}
function allowedChoice(provinceCode: string, candidacyId: string) {
  return candidaciesForProvince(provinceCode).some((c) => c.id === candidacyId);
}
async function insertBallot(client: PoolClient, provinceCode: string, candidacyId: string) {
  const simulated = false;
  // Do not link stored ballot rows to browser or IP identifiers.
  await client.query(
    "INSERT INTO poll_private.ballots(id,campaign_id,province_code,candidacy_id,consent_version,simulated) VALUES($1,$2,$3,$4,$5,$6)",
    [randomUUID(), CAMPAIGN, provinceCode, candidacyId, CONSENT_VERSION, simulated],
  );
  await client.query(
    `INSERT INTO poll_private.counts(campaign_id,province_code,candidacy_id,simulated,n) VALUES($1,$2,$3,$4,1)
     ON CONFLICT(campaign_id,province_code,candidacy_id,simulated) DO UPDATE SET n=poll_private.counts.n+1`,
    [CAMPAIGN, provinceCode, candidacyId, simulated],
  );
}

/** Fully atomic storage; this function alone does NOT authorize a live public endpoint. */
export async function saveApprovedVote(pool: Pool, secret: string, vote: Vote): Promise<SaveResult> {
  if (secret.length < 32) throw new Error("HMAC_SECRET_REQUIRED");
  if (!/^[0-9]{2}$/.test(vote.provinceCode) || !allowedChoice(vote.provinceCode, vote.candidacyId))
    return { accepted: false, code: "INVALID_CANDIDACY" };
  if (!/^[a-f0-9]{64}$/.test(vote.browserToken) || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(vote.requestToken))
    return { accepted: false, code: "INVALID_TOKEN" };
  if (isIP(vote.ip) === 0) return { accepted: false, code: "INVALID_CLIENT" };
  const ipHash = hmac(secret, `${CAMPAIGN}:ip`, vote.ip);
  const browserHash = hmac(secret, `${CAMPAIGN}:browser`, vote.browserToken);
  const requestHash = hmac(secret, `${CAMPAIGN}:request`, vote.requestToken);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize on IP and browser to prevent concurrent double acceptance.
    for (const key of [ipHash, browserHash].sort())
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [key]);
    const seen = await client.query("SELECT 1 FROM poll_private.idempotency WHERE campaign_id=$1 AND request_digest=$2", [CAMPAIGN, requestHash]);
    if (seen.rowCount) { await client.query("ROLLBACK"); return { accepted: false, code: "ALREADY_SUBMITTED" }; }
    await client.query(
      "DELETE FROM poll_private.ip_window WHERE campaign_id=$1 AND ip_digest=$2 AND hit_at <= now() - make_interval(secs => $3)",
      [CAMPAIGN, ipHash, voteLimits.ipWindowSeconds],
    );
    const window = await client.query<{ used: number; retry: number | null }>(
      `SELECT count(*)::int AS used,
              ceil(extract(epoch FROM min(hit_at) + make_interval(secs => $3) - now()))::int AS retry
         FROM poll_private.ip_window WHERE campaign_id=$1 AND ip_digest=$2`,
      [CAMPAIGN, ipHash, voteLimits.ipWindowSeconds],
    );
    if (window.rows[0].used >= voteLimits.perIpWindow) {
      await client.query("ROLLBACK");
      return { accepted: false, code: "IP_WINDOW_LIMIT", retryAfterSeconds: Math.max(1, window.rows[0].retry ?? 1) };
    }
    const already = await client.query("SELECT 1 FROM poll_private.browser_lifetime WHERE campaign_id=$1 AND browser_digest=$2", [CAMPAIGN, browserHash]);
    if (already.rowCount) { await client.query("ROLLBACK"); return { accepted: false, code: "BROWSER_LIMIT" }; }
    await client.query("INSERT INTO poll_private.ip_window(campaign_id,ip_digest) VALUES($1,$2)", [CAMPAIGN, ipHash]);
    await client.query("INSERT INTO poll_private.browser_lifetime(campaign_id,browser_digest) VALUES($1,$2)", [CAMPAIGN, browserHash]);
    await insertBallot(client, vote.provinceCode, vote.candidacyId);
    await client.query("INSERT INTO poll_private.idempotency(campaign_id,request_digest) VALUES($1,$2)", [CAMPAIGN, requestHash]);
    await client.query("COMMIT");
    return { accepted: true, code: "RECORDED" };
  } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
}

export type CountRow = { province_code: string; candidacy_id: string; n: number };
/** Only real votes are ever read for results. */
export async function readCounts(pool: Pool): Promise<CountRow[]> {
  const r = await pool.query<{ province_code: string; candidacy_id: string; n: string }>(
    `SELECT province_code, candidacy_id::text, sum(n)::text AS n
       FROM poll_private.counts WHERE campaign_id=$1 AND NOT simulated GROUP BY 1,2`,
    [CAMPAIGN],
  );
  return r.rows.map((x) => ({ ...x, n: Number(x.n) }));
}

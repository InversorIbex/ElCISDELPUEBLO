import type { Pool } from "pg";
import { digest } from "./crypto.ts";
export async function consumeTestRateLimit(
  pool: Pool,
  hashKey: Buffer,
  campaignId: string,
  opaqueScope: string,
  limit: number,
  windowSeconds: number,
) {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 10000 ||
    !Number.isSafeInteger(windowSeconds) ||
    windowSeconds < 1 ||
    windowSeconds > 3600
  )
    throw new Error("INVALID_RATE_POLICY");
  const key = digest(hashKey, campaignId, opaqueScope, "rate");
  const result = await pool.query(
    `INSERT INTO authorization_private.rate_buckets(scope_digest,hits,expires_at) VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(scope_digest) DO UPDATE SET hits=CASE WHEN authorization_private.rate_buckets.expires_at<=now() THEN 1 ELSE LEAST(authorization_private.rate_buckets.hits,2147483646)+1 END, expires_at=CASE WHEN authorization_private.rate_buckets.expires_at<=now() THEN now()+$2*interval '1 second' ELSE authorization_private.rate_buckets.expires_at END RETURNING hits,expires_at`,
    [key, windowSeconds],
  );
  return {
    allowed: result.rows[0].hits <= limit,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil(
        (new Date(result.rows[0].expires_at).getTime() - Date.now()) / 1000,
      ),
    ),
  };
}

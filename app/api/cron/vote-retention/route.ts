import { timingSafeEqual } from "node:crypto";
import { Pool } from "pg";
import { voteDbConfig } from "@/lib/server/vote-db";

// GET endpoint invoked by Vercel Cron. Never expose the cleanup credential to
// the public vote handler, and never use a database owner credential here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let cleanupPool: Pool | undefined;

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32 || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(header, "utf8");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization")))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const url = process.env.VOTE_CLEANUP_DATABASE_URL;
  if (process.env.VERCEL_ENV !== "production" || !url || !/^postgres(?:ql)?:\/\//.test(url))
    return Response.json({ error: "CLEANUP_NOT_CONFIGURED" }, { status: 503 });

  cleanupPool ??= new Pool({ ...voteDbConfig(url), max: 1, statement_timeout: 15000 });
  const client = await cleanupPool.connect();
  try {
    await client.query("BEGIN");
    // IP window digests are useless once the 5-hour window has passed.
    // Do not delete ballots, campaign-long browser markers or counters.
    const ip = await client.query(
      "DELETE FROM poll_private.ip_window WHERE hit_at <= now() - interval '5 hours'",
    );
    // 48h: allows the same request-id to be recognized during retries.
    const idempotency = await client.query(
      "DELETE FROM poll_private.idempotency WHERE accepted_at < now() - interval '48 hours'",
    );
    await client.query("COMMIT");
    return Response.json({
      ok: true,
      removed: { ipWindow: ip.rowCount, requestDigests: idempotency.rowCount },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return Response.json({ error: "CLEANUP_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  } finally {
    client.release();
  }
}

import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let pool: Pool | null = null;
function getPool() {
  // A dedicated SELECT-only role is required before this route is merged.
  // Never use the database owner credential for public production traffic.
  const connectionString = process.env.CATALOG_READONLY_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_NOT_CONFIGURED");
  pool ??= new Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 4000,
    idleTimeoutMillis: 10000,
    statement_timeout: 5000,
    allowExitOnIdle: true,
  });
  return pool;
}

/**
 * Checks the public electoral catalogue only. Does NOT accept ballots,
 * disclose credentials, or query personal/political opinion tables.
 */
export async function GET() {
  try {
    const result = await getPool().query(`
      SELECT
        (SELECT count(*)::int FROM reference.autonomous_communities) AS territories,
        (SELECT count(*)::int FROM reference.provinces) AS constituencies,
        (SELECT count(*)::int FROM catalog.registered_congress_candidacies
          WHERE edition_id = 'congress-2026') AS candidacies,
        (SELECT count(DISTINCT province_code)::int FROM catalog.registered_congress_candidacies
          WHERE edition_id = 'congress-2026') AS covered_constituencies,
        (SELECT count(*)::int FROM pg_tables
          WHERE schemaname IN ('reference','catalog') AND NOT rowsecurity) AS unprotected_tables
    `);
    const r = result.rows[0];
    const ready = r.territories === 19 &&
      r.constituencies === 52 &&
      r.candidacies === 534 &&
      r.covered_constituencies === 52 &&
      r.unprotected_tables === 0;
    return Response.json({
      ready,
      catalog: {
        territories: r.territories,
        constituencies: r.constituencies,
        candidacies: r.candidacies,
        coveredConstituencies: r.covered_constituencies,
      },
      // This is a distinct launch decision. Database connectivity never enables voting.
      participation: "closed",
    }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { ready: false, participation: "closed" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

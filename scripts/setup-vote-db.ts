/**
 * Prepara la base de datos de votos de producción (Supabase):
 * migraciones db/migrations, territorios INE y candidaturas proclamadas (BOE).
 * Idempotente. Exige confirmación explícita para no ejecutarse por error.
 *
 *   VOTE_DATABASE_URL=... node --experimental-strip-types scripts/setup-vote-db.ts --confirmo-produccion
 */
import pg from "pg";
import { migrateTestDatabase } from "../lib/server/migrations.ts";
import { importTestTerritories } from "../lib/server/import-territories.ts";
import { importTestCandidacyRegistry } from "../lib/server/import-candidacies.ts";
import { voteDbConfig } from "../lib/server/vote-db.ts";

const url = process.env.VOTE_DATABASE_URL;
if (!url) { console.error("Falta VOTE_DATABASE_URL."); process.exit(1); }
if (!process.argv.includes("--confirmo-produccion")) {
  console.error("Añade --confirmo-produccion para aplicar cambios en esta base de datos.");
  process.exit(1);
}
const pool = new pg.Pool({ ...voteDbConfig(url), max: 2, statement_timeout: 120000 });
try {
  const { rows } = await pool.query("SELECT current_database() AS db, split_part(version(),' ',2) AS v");
  console.log(`Conectado a ${new URL(url).hostname} · ${rows[0].db} · PostgreSQL ${rows[0].v}`);
  const opts = { productionSetup: true };
  await migrateTestDatabase(pool, opts);
  const applied = await pool.query("SELECT name FROM operations.schema_migrations ORDER BY name");
  console.log("Migraciones:", applied.rows.map((r) => r.name).join(", "));
  console.log("Territorios:", await importTestTerritories(pool, opts));
  console.log("Candidaturas:", await importTestCandidacyRegistry(pool, opts));
  const check = await pool.query(`SELECT (SELECT count(*)::int FROM reference.provinces) AS provincias,
    (SELECT count(*)::int FROM catalog.registered_congress_candidacies) AS candidaturas,
    (SELECT count(*)::int FROM poll_private.ballots) AS votos`);
  console.log("Comprobación:", check.rows[0]);
} catch (e) {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally { await pool.end(); }

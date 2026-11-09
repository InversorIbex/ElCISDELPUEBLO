import type { Pool } from "pg";
import { transaction } from "./db.ts";
import { candidacies, candidacyInfo } from "../candidacies/registry.ts";
export async function importTestCandidacyRegistry(pool: Pool, opts: { productionSetup?: boolean } = {}) {
  if (!opts.productionSetup && !(await pool.query("SELECT current_database() AS name")).rows[0].name.endsWith("_test"))
    throw new Error("TEST_DATABASE_REQUIRED");
  const edition = `congress-2026-${candidacyInfo.asOf}-${candidacyInfo.sources[0].sha256.slice(0, 12)}-${candidacyInfo.sources[1].sha256.slice(0, 12)}`;
  return transaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(79421038)");
    const exists = await client.query(
      "SELECT 1 FROM catalog.candidacy_registry_editions WHERE id=$1",
      [edition],
    );
    if (exists.rowCount) {
      const rows = await client.query(
        "SELECT count(*)::int AS n FROM catalog.registered_congress_candidacies WHERE edition_id=$1",
        [edition],
      );
      if (rows.rows[0].n !== 534) throw new Error("REGISTRY_INTEGRITY_ERROR");
      return { edition, count: 534 };
    }
    await client.query(
      "INSERT INTO catalog.candidacy_registry_editions(id,election_date,reviewed_as_of,proclaimed_source_url,proclaimed_sha256,correction_source_url,correction_sha256) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        edition,
        "2026-11-29",
        candidacyInfo.asOf,
        candidacyInfo.sources[0].url,
        candidacyInfo.sources[0].sha256,
        candidacyInfo.sources[1].url,
        candidacyInfo.sources[1].sha256,
      ],
    );
    await client.query(
      `INSERT INTO catalog.registered_congress_candidacies(edition_id,id,province_code,proclamation_order,official_name,status,source_paragraph,correction_applied) SELECT $1,c.id::uuid,c."provinceCode",c."order",c."officialName",c.status,c."sourceParagraphIndex",c."correctionApplied" FROM jsonb_to_recordset($2::jsonb) AS c(id text,"provinceCode" text,"order" int,"officialName" text,status text,"sourceParagraphIndex" int,"correctionApplied" boolean)`,
      [edition, JSON.stringify(candidacies)],
    );
    return { edition, count: candidacies.length };
  });
}

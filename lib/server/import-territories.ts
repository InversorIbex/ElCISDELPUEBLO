import type { Pool } from "pg";
import { transaction } from "./db.ts";
import {
  communities,
  provinces,
  municipalities,
  catalogInfo,
} from "../territories.ts";
export async function importTestTerritories(pool: Pool, opts: { productionSetup?: boolean } = {}) {
  if (!opts.productionSetup && !(await pool.query("SELECT current_database() AS name")).rows[0].name.endsWith("_test"))
    throw new Error("TEST_DATABASE_REQUIRED");
  return transaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(79421037)");
    await client.query(
      "CREATE TEMP TABLE stage_communities(code char(2) PRIMARY KEY, official_name text NOT NULL) ON COMMIT DROP",
    );
    await client.query(
      "CREATE TEMP TABLE stage_provinces(code char(2) PRIMARY KEY, community_code char(2) NOT NULL, official_name text NOT NULL) ON COMMIT DROP",
    );
    await client.query(
      "CREATE TEMP TABLE stage_municipalities(ine_code char(5) PRIMARY KEY, province_code char(2) NOT NULL,official_name text NOT NULL,source_version text NOT NULL) ON COMMIT DROP",
    );
    await client.query(
      `INSERT INTO stage_communities SELECT code,name FROM jsonb_to_recordset($1::jsonb) AS c(code text,name text)`,
      [JSON.stringify(communities)],
    );
    await client.query(
      `INSERT INTO stage_provinces SELECT code,"communityCode",name FROM jsonb_to_recordset($1::jsonb) AS p(code text,"communityCode" text,name text)`,
      [JSON.stringify(provinces)],
    );
    await client.query(
      `INSERT INTO stage_municipalities SELECT code,"provinceCode",name,$2 FROM jsonb_to_recordset($1::jsonb) AS m(code text,"provinceCode" text,name text)`,
      [JSON.stringify(municipalities), catalogInfo.version],
    );
    const invalid = await client.query(
      `SELECT 1 FROM stage_municipalities m LEFT JOIN stage_provinces p ON p.code=m.province_code LEFT JOIN stage_communities c ON c.code=p.community_code WHERE p.code IS NULL OR c.code IS NULL OR left(m.ine_code,2)<>m.province_code LIMIT 1`,
    );
    if (invalid.rowCount) throw new Error("TERRITORY_INTEGRITY_ERROR");
    const previous = await client.query(
      `SELECT 1 FROM reference.municipalities old LEFT JOIN stage_municipalities new ON new.ine_code=old.ine_code WHERE new.ine_code IS NULL OR new.province_code<>old.province_code LIMIT 1`,
    );
    if (previous.rowCount) throw new Error("HISTORICAL_CODE_REVIEW_REQUIRED");
    await client.query(
      `INSERT INTO reference.autonomous_communities SELECT * FROM stage_communities ON CONFLICT(code) DO UPDATE SET official_name=excluded.official_name`,
    );
    await client.query(
      `INSERT INTO reference.provinces(code,community_code,official_name) SELECT code,community_code,official_name FROM stage_provinces ON CONFLICT(code) DO UPDATE SET official_name=excluded.official_name,community_code=excluded.community_code`,
    );
    await client.query(
      `INSERT INTO reference.municipalities(ine_code,province_code,official_name,source_version) SELECT * FROM stage_municipalities ON CONFLICT(ine_code) DO UPDATE SET official_name=excluded.official_name,source_version=excluded.source_version`,
    );
    return {
      communities: communities.length,
      provinces: provinces.length,
      municipalities: municipalities.length,
    };
  });
}

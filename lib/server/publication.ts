import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { transaction } from "./db.ts";
import { assessRelease, type ResultCell } from "../results.ts";
export async function createTestRelease(
  pool: Pool,
  campaignId: string,
  reviewReference: string,
) {
  if (!/^TEST-REVIEW-[a-zA-Z0-9-]{1,180}$/.test(reviewReference))
    throw new Error("TEST_REVIEW_REQUIRED");
  return transaction(pool, async (client) => {
    const c = await client.query(
      "SELECT * FROM catalog.campaigns WHERE id=$1 FOR UPDATE",
      [campaignId],
    );
    if (!c.rowCount || c.rows[0].is_test !== true)
      throw new Error("TEST_CAMPAIGN_REQUIRED");
    const previous = await client.query(
      "SELECT 1 FROM publication.releases WHERE campaign_id=$1",
      [campaignId],
    );
    const counts = await client.query(
      `SELECT o.id AS "optionId",o.label,o.category,coalesce(sum(c.responses),0)::int AS responses FROM catalog.campaign_options o LEFT JOIN aggregation_private.counts c ON c.campaign_id=o.campaign_id AND c.option_id=o.id WHERE o.campaign_id=$1 GROUP BY o.id,o.label,o.category`,
      [campaignId],
    );
    const assessment = assessRelease({
      cells: counts.rows as ResultCell[],
      campaignClosed: c.rows[0].status === "closed",
      hasPreviousRelease: !!previous.rowCount,
      reviewed: true,
      level: "national",
    });
    if (!assessment.allowed) return assessment;
    const id = randomUUID();
    await client.query(
      "INSERT INTO publication.releases(id,campaign_id,metric,review_reference,payload) VALUES($1,$2,$3,$4,$5::jsonb)",
      [
        id,
        campaignId,
        assessment.metric,
        reviewReference,
        JSON.stringify(assessment.data),
      ],
    );
    return { allowed: true as const, id, data: assessment.data };
  });
}

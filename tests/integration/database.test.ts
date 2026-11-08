import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createTestPool } from "../../lib/server/db.ts";
import { migrateTestDatabase } from "../../lib/server/migrations.ts";
import { importTestTerritories } from "../../lib/server/import-territories.ts";
import { TestParticipationService } from "../../lib/server/participation.ts";
import { privateSecret, digest } from "../../lib/server/crypto.ts";
import { consumeTestRateLimit } from "../../lib/server/rate-limit.ts";
import { createTestRelease } from "../../lib/server/publication.ts";
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL_REQUIRED");
const pool = createTestPool(url);
const encryptionKey = randomBytes(32),
  hashKey = randomBytes(32);
const service = new TestParticipationService(pool, encryptionKey, hashKey);
async function campaign(kind = "election") {
  const id = randomUUID(),
    a = randomUUID(),
    b = randomUUID();
  await pool.query(
    `INSERT INTO catalog.campaigns(id,slug,title,kind,status,consent_version) VALUES($1,$2,'TEST SINTÉTICO — NO SONDEO REAL',$3,'open','TEST-CONSENT-v1')`,
    [id, `test-${id}`, kind],
  );
  for (const [option, label] of [
    [a, "OPCIÓN SINTÉTICA A"],
    [b, "OPCIÓN SINTÉTICA B"],
  ]) {
    await pool.query(
      "INSERT INTO catalog.campaign_options(campaign_id,id,label,category) VALUES($1,$2,$3,$4)",
      [id, option, label, kind === "single_choice" ? "topic" : "candidacy"],
    );
    await pool.query(
      "INSERT INTO catalog.option_provinces(campaign_id,option_id,province_code) VALUES($1,$2,$3)",
      [id, option, "27"],
    );
  }
  return { id, a, b };
}
async function response(
  c: { id: string; a: string },
  extra: Record<string, unknown> = {},
) {
  return {
    campaignId: c.id,
    token: await service.issueToken(c.id),
    credential: privateSecret(),
    municipalityCode: "27027",
    optionId: c.a,
    consentVersion: "TEST-CONSENT-v1",
    explicitConsent: true,
    ...extra,
  };
}
async function total(id: string) {
  return Number(
    (
      await pool.query(
        "SELECT coalesce(sum(responses),0)::int AS total FROM aggregation_private.counts WHERE campaign_id=$1",
        [id],
      )
    ).rows[0].total,
  );
}
test("PostgreSQL real: migraciones, catálogo, participación privada y publicación de prueba", async (t) => {
  try {
    await t.test(
      "migraciones aplicadas dos veces sin duplicar y catálogo completo en transacción",
      async () => {
        await migrateTestDatabase(pool);
        await migrateTestDatabase(pool);
        assert.deepEqual(await importTestTerritories(pool), {
          communities: 19,
          provinces: 52,
          municipalities: 8132,
        });
        await importTestTerritories(pool);
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM reference.municipalities",
            )
          ).rows[0].n,
          8132,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM operations.schema_migrations",
            )
          ).rows[0].n,
          2,
        );
      },
    );
    await t.test(
      "no permitir campañas reales en esquema de laboratorio",
      async () => {
        await assert.rejects(
          pool.query(
            `INSERT INTO catalog.campaigns(id,slug,title,kind,status,consent_version,is_test) VALUES($1,'forbidden-real','NO','election','open','v1',false)`,
            [randomUUID()],
          ),
          /check constraint/,
        );
      },
    );
    await t.test(
      "insertar respuesta cifrada sin IP ni secreto en los registros",
      async () => {
        const c = await campaign(),
          input = await response(c);
        assert.deepEqual(await service.submit(input), { revision: 1 });
        assert.equal(await total(c.id), 1);
        const row = (
          await pool.query(
            "SELECT * FROM participation_private.ballots WHERE campaign_id=$1",
            [c.id],
          )
        ).rows[0];
        assert.ok(!row.encrypted_payload.includes(input.optionId));
        assert.ok(!row.encrypted_payload.includes("27027"));
        assert.ok(!JSON.stringify(row).includes(input.credential));
        const credentials = (
          await pool.query(
            "SELECT * FROM authorization_private.credentials WHERE campaign_id=$1",
            [c.id],
          )
        ).rows[0];
        assert.equal(
          credentials.digest,
          digest(hashKey, c.id, input.credential, "credential"),
        );
        assert.ok(!Object.keys(row).some((k) => /ip|token|credential/.test(k)));
      },
    );
    await t.test(
      "token de un uso y concurrencia: exactamente una inserción",
      async () => {
        const c = await campaign(),
          input = await response(c);
        const results = await Promise.allSettled([
          service.submit(input),
          service.submit({ ...input, credential: privateSecret() }),
        ]);
        assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
        assert.equal(await total(c.id), 1);
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM participation_private.ballots WHERE campaign_id=$1",
              [c.id],
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "corregir no duplica, concurrencia rechaza revisión obsoleta",
      async () => {
        const c = await campaign(),
          input = await response(c);
        await service.submit(input);
        const change = {
          campaignId: c.id,
          credential: input.credential,
          expectedRevision: 1,
          municipalityCode: "27027",
          optionId: c.b,
        };
        const results = await Promise.allSettled([
          service.replace(change),
          service.replace(change),
        ]);
        assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
        const failed = results.find((r) => r.status === "rejected");
        assert.equal(
          failed?.status === "rejected" && failed.reason.code,
          "REVISION_CONFLICT",
        );
        assert.equal(await total(c.id), 1);
        assert.equal(
          Number(
            (
              await pool.query(
                "SELECT responses FROM aggregation_private.counts WHERE campaign_id=$1 AND option_id=$2",
                [c.id, c.b],
              )
            ).rows[0].responses,
          ),
          1,
        );
      },
    );
    await t.test(
      "revocar borra respuesta, credencial y consentimiento y resta agregado",
      async () => {
        const c = await campaign(),
          input = await response(c);
        await service.submit(input);
        await service.withdraw(c.id, input.credential);
        assert.equal(await total(c.id), 0);
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM participation_private.ballots WHERE campaign_id=$1",
              [c.id],
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM authorization_private.credentials WHERE campaign_id=$1",
              [c.id],
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM authorization_private.consents WHERE credential_digest=$1",
              [digest(hashKey, c.id, input.credential, "credential")],
            )
          ).rows[0].n,
          0,
        );
        await assert.rejects(
          service.withdraw(c.id, input.credential),
          /CREDENTIAL_NOT_FOUND/,
        );
      },
    );
    await t.test(
      "validaciones de consentimiento y territorio ocurren antes de consumir token",
      async () => {
        const c = await campaign(),
          input = await response(c);
        for (const update of [
          { explicitConsent: false },
          { consentVersion: "old" },
          { municipalityCode: "28079" },
          { municipalityCode: "99999" },
          { optionId: randomUUID() },
        ])
          await assert.rejects(service.submit({ ...input, ...update }));
        assert.equal(await total(c.id), 0);
        await service.submit(input);
        assert.equal(await total(c.id), 1);
      },
    );
    await t.test(
      "fallo por credencial duplicada revierte consumo del token",
      async () => {
        const c = await campaign(),
          input = await response(c);
        await service.submit(input);
        const second = await response(c, { credential: input.credential });
        await assert.rejects(service.submit(second), /CREDENTIAL_ALREADY_USED/);
        await service.submit({ ...second, credential: privateSecret() });
        assert.equal(await total(c.id), 2);
      },
    );
    await t.test("tokens caducados no permiten participación", async () => {
      const c = await campaign(),
        input = await response(c);
      await pool.query(
        `UPDATE authorization_private.one_time_tokens SET expires_at=now()-interval '1 second' WHERE digest=$1`,
        [digest(hashKey, c.id, input.token, "token")],
      );
      await assert.rejects(service.submit(input), /TOKEN_INVALID_OR_USED/);
      assert.equal(await total(c.id), 0);
    });
    await t.test(
      "aislamiento entre campañas y preguntas, incluso reutilizando secreto",
      async () => {
        const c = await campaign(),
          q = await campaign("single_choice"),
          input = await response(c);
        await service.submit(input);
        await assert.rejects(
          service.replace({
            campaignId: q.id,
            credential: input.credential,
            municipalityCode: "27027",
            optionId: q.a,
            expectedRevision: 1,
          }),
          /CREDENTIAL_NOT_FOUND/,
        );
        await assert.rejects(
          service.submit(await response(q, { optionId: c.a })),
          /OPTION_NOT_AVAILABLE/,
        );
        await service.submit(
          await response(q, { credential: input.credential }),
        );
        const digests = await pool.query(
          "SELECT digest FROM authorization_private.credentials WHERE campaign_id IN ($1,$2)",
          [c.id, q.id],
        );
        assert.equal(new Set(digests.rows.map((r) => r.digest)).size, 2);
      },
    );
    await t.test(
      "límite compartido admite solo N peticiones concurrentes y separa campañas",
      async () => {
        const c = await campaign(),
          scope = privateSecret();
        const results = await Promise.all(
          Array.from({ length: 12 }, () =>
            consumeTestRateLimit(pool, hashKey, c.id, scope, 3, 30),
          ),
        );
        assert.equal(results.filter((r) => r.allowed).length, 3);
        assert.equal(
          (
            await consumeTestRateLimit(
              pool,
              hashKey,
              randomUUID(),
              scope,
              3,
              30,
            )
          ).allowed,
          true,
        );
      },
    );
    await t.test(
      "rol público sin privilegios no lee ni escribe opiniones o agregados",
      async () => {
        await pool.query(
          `DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='cis_public_test') THEN CREATE ROLE cis_public_test NOLOGIN; END IF; END $$`,
        );
        const client = await pool.connect();
        try {
          await client.query("SET ROLE cis_public_test");
          await assert.rejects(
            client.query("SELECT * FROM participation_private.ballots"),
            /permission denied/,
          );
          await assert.rejects(
            client.query("SELECT * FROM aggregation_private.counts"),
            /permission denied/,
          );
          await assert.rejects(
            client.query("DELETE FROM authorization_private.credentials"),
            /permission denied/,
          );
        } finally {
          await client.query("RESET ROLE");
          client.release();
        }
      },
    );
    await t.test(
      "publicación sintética única: bloqueo de muestra pequeña, campaña abierta y diferencias",
      async () => {
        const c = await campaign();
        assert.equal(
          (await createTestRelease(pool, c.id, "TEST-REVIEW-suite")).allowed,
          false,
        );
        await service.submit(await response(c));
        await pool.query(
          "UPDATE catalog.campaigns SET status='closed' WHERE id=$1",
          [c.id],
        );
        assert.equal(
          (await createTestRelease(pool, c.id, "TEST-REVIEW-suite")).allowed,
          false,
        );
        await pool.query(
          "UPDATE catalog.campaigns SET status='open' WHERE id=$1",
          [c.id],
        );
        await Promise.all(
          Array.from({ length: 99 }, async (_, i) =>
            service.submit(await response(c, { optionId: i < 49 ? c.a : c.b })),
          ),
        );
        assert.equal(await total(c.id), 100);
        await pool.query(
          "UPDATE catalog.campaigns SET status='closed' WHERE id=$1",
          [c.id],
        );
        const release = await createTestRelease(
          pool,
          c.id,
          "TEST-REVIEW-suite",
        );
        assert.equal(release.allowed, true);
        if (release.allowed) assert.equal(release.data.total, 100);
        assert.equal(
          (await createTestRelease(pool, c.id, "TEST-REVIEW-suite")).allowed,
          false,
        );
        await assert.rejects(service.issueToken(c.id), /CAMPAIGN_CLOSED/);
      },
    );
  } finally {
    await pool.end();
  }
});

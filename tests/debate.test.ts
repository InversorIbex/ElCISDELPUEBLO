import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEBATE_OPTIONS, debatePercentages, isDebateOption, isDebateVoteOpen } from "../lib/debate.ts";
import { DEBATE_SCHEMA_SQL, saveDebateVote } from "../lib/server/debate-vote.ts";
import { KEYWORDS, debateEventLd, ldJson } from "../lib/seo.ts";

test("debate: cuatro candidatos y la opción Ninguno", () => {
  assert.deepEqual(DEBATE_OPTIONS.map((o) => o.id), ["sanchez", "feijoo", "abascal", "colau", "ninguno"]);
  assert.ok(isDebateOption("ninguno"));
  assert.ok(!isDebateOption("montero"));
});

test("debate: porcentajes con un decimal que suman 100", () => {
  const { hasVotes, shares } = debatePercentages({ sanchez: 1, feijoo: 1, abascal: 1 });
  assert.equal(hasVotes, true);
  assert.deepEqual(shares, { sanchez: 33.4, feijoo: 33.3, abascal: 33.3, colau: 0, ninguno: 0 });
  const sum = Object.values(debatePercentages({ sanchez: 7, feijoo: 3, abascal: 5, colau: 2, ninguno: 1 }).shares)
    .reduce((a, b) => a + b, 0);
  assert.equal(Math.round(sum * 10), 1000);
  assert.equal(debatePercentages({}).hasVotes, false);
  assert.equal(debatePercentages({ otro: 5 }).hasVotes, false);
});

test("debate: la votación cierra el sábado 28-N a las 23:59 (hora peninsular)", () => {
  assert.equal(isDebateVoteOpen(new Date("2026-11-28T22:59:59Z")), true);
  assert.equal(isDebateVoteOpen(new Date("2026-11-28T23:00:00Z")), false);
});

test("debate: el guardado rechaza fuera de plazo y opciones inválidas sin tocar la base", async () => {
  const pool = { connect: () => { throw new Error("NO_DB"); }, query: () => { throw new Error("NO_DB"); } } as never;
  const secret = "x".repeat(32);
  const base = { browserToken: "a".repeat(64), ip: "203.0.113.7", requestToken: "123e4567-e89b-42d3-a456-426614174000" };
  assert.deepEqual(await saveDebateVote(pool, secret, { ...base, optionId: "sanchez" }, new Date("2026-11-29T10:00:00Z")),
    { accepted: false, code: "CLOSED" });
  const open = new Date("2026-11-27T10:00:00Z");
  assert.equal((await saveDebateVote(pool, secret, { ...base, optionId: "montero" }, open)).code, "INVALID_OPTION");
  assert.equal((await saveDebateVote(pool, secret, { ...base, optionId: "sanchez", browserToken: "x" }, open)).code, "INVALID_TOKEN");
  assert.equal((await saveDebateVote(pool, secret, { ...base, optionId: "sanchez", ip: "nope" }, open)).code, "INVALID_CLIENT");
});

test("debate: la migración y el esquema de arranque crean las mismas tablas", () => {
  const migration = readFileSync("db/migrations/0006_debate_vote.sql", "utf8");
  const tables = (text: string) => [...text.matchAll(/CREATE TABLE IF NOT EXISTS (poll_private\.\w+)/g)].map((m) => m[1]).sort();
  assert.deepEqual(tables(DEBATE_SCHEMA_SQL.join("\n")), tables(migration));
  assert.equal(tables(migration).length, 4);
  for (const t of tables(migration)) assert.match(migration, new RegExp(`ALTER TABLE ${t.replace(".", "\\.")} ENABLE ROW LEVEL SECURITY`));
});

test("SEO del debate: palabras clave y datos estructurados", () => {
  for (const k of ["quién ganó el debate", "debate a cuatro", "Pedro Sánchez", "Alberto Núñez Feijóo", "Santiago Abascal", "Ada Colau"])
    assert.ok(KEYWORDS.includes(k), k);
  for (const k of ["elecciones generales 2026", "intención de voto", "PSOE"]) assert.ok(KEYWORDS.includes(k), k);
  const parsed = JSON.parse(ldJson(debateEventLd));
  assert.equal(parsed["@graph"][0].performer.length, 4);
  assert.equal(parsed["@graph"][0].startDate, "2026-11-26T22:00:00+01:00");
});

import test from "node:test";
import assert from "node:assert/strict";
import { buildLiveResults, randomSimulatedVotes, simulatedVotesPerTick, type CountInput } from "../lib/live-results.ts";
import { candidaciesForProvince } from "../lib/candidacies/registry.ts";
import { groupForCandidacy } from "../lib/party-groups.ts";
import { voteDbConfig } from "../lib/server/vote-db.ts";

const before = new Date("2026-11-10T12:00:00Z"); // fuera de la veda
const madrid = candidaciesForProvince("28");
const byGroup = (code: string, id: string) => candidaciesForProvince(code).find((c) => groupForCandidacy(c.officialName).id === id)!;
const row = (p: string, id: string, real_n: number, simulated_n = 0): CountInput => ({ province_code: p, candidacy_id: id, real_n, simulated_n });

test("colorea con la más votada, calcula % y reparte 38 escaños en Madrid", () => {
  const pp = byGroup("28", "PP"), psoe = byGroup("28", "PSOE");
  const r = buildLiveResults([row("28", pp.id, 60), row("28", psoe.id, 40)], { includeSimulated: false, minCount: 50, now: before });
  const m = r.provinces["28"];
  assert.equal(m.winner?.groupId, "PP");
  assert.equal(m.rows[0].pct, 60);
  assert.equal(m.rows.reduce((s, x) => s + x.seats, 0), 38);
  assert.equal(r.hemicycle.unassigned, 350 - 38);
  assert.equal(r.hemicycle.groups.reduce((s, g) => s + g.seats, 0) + r.hemicycle.unassigned, 350);
});

test("por debajo del umbral no publica reparto y suprime en complementaria", () => {
  const soria = candidaciesForProvince("42")[0];
  const pp = byGroup("28", "PP"), vox = byGroup("28", "VOX");
  const r = buildLiveResults([row("42", soria.id, 10), row("28", pp.id, 30), row("28", vox.id, 30)], { includeSimulated: false, minCount: 50, now: before });
  assert.equal(r.provinces["42"].suppressed, "insufficient");
  assert.equal(r.provinces["42"].rows.length, 0);
  // 10 votos de Soria se deducirían restando: Madrid (la menor publicada) también se oculta.
  assert.equal(r.provinces["28"].suppressed, "complementary");
});

test("simulados solo cuentan si se incluyen", () => {
  const rows = [row("28", madrid[0].id, 5, 100), row("28", madrid[1].id, 0, 80)];
  assert.equal(buildLiveResults(rows, { includeSimulated: false, minCount: 50, now: before }).totals.shown, 5);
  const on = buildLiveResults(rows, { includeSimulated: true, minCount: 50, now: before });
  assert.deepEqual(on.totals, { real: 5, simulated: 180, shown: 185 });
  assert.equal(on.provinces["28"].suppressed, null);
});

test("veda electoral: no devuelve resultados", () => {
  const r = buildLiveResults([row("28", madrid[0].id, 500), row("28", madrid[1].id, 500)], { includeSimulated: false, minCount: 50, now: new Date("2026-11-25T12:00:00Z") });
  assert.equal(r.blackout, true);
  assert.deepEqual(r.provinces, {});
  assert.equal(r.totals.shown, 1000);
});

test("simulador: 4, 8, 16… con tope y solo candidaturas de su circunscripción", () => {
  const start = new Date("2026-11-09T00:00:00Z");
  assert.deepEqual([0, 1, 2, 3].map((d) => simulatedVotesPerTick(start, new Date(start.getTime() + d * 86_400_000 + 1000))), [4, 8, 16, 32]);
  assert.equal(simulatedVotesPerTick(start, new Date("2027-01-01"), 4, 512), 512);
  for (const v of randomSimulatedVotes(1000)) assert.ok(candidaciesForProvince(v.provinceCode).some((c) => c.id === v.candidacyId));
});

test("agrupación nacional de candidaturas", () => {
  assert.equal(groupForCandidacy("PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA (PSOE) PSE-EE (PSOE)").id, "PSOE");
  assert.equal(groupForCandidacy("SE ACABÓ LA FIESTA (SALF)").id, "SALF");
  assert.equal(groupForCandidacy("UNIDAD DEL PUEBLO CANARIO UPC (NC-BC, PODEMOS, IU, SUMAR)").id, "SUMAR");
  assert.ok(groupForCandidacy("PARTIDO ANIMALISTA CON EL MEDIO AMBIENTE (PACMA)").id.startsWith("OTRA:"));
});

test("conexión a Supabase: TLS verificado y sin sslmode en la URL", () => {
  const c = voteDbConfig("postgresql://u:p@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require", {});
  assert.equal((c.ssl as { rejectUnauthorized: boolean }).rejectUnauthorized, true);
  assert.match(String((c.ssl as { ca: string }).ca), /BEGIN CERTIFICATE/);
  assert.ok(!String(c.connectionString).includes("sslmode"));
});

test("D'Hondt: ejemplo del art. 163 LOREG y empate absoluto marcado", async () => {
  const { dhondt } = await import("../lib/live-results.ts");
  const r = dhondt([{ id: "A", votes: 168000 }, { id: "B", votes: 104000 }, { id: "C", votes: 72000 }, { id: "D", votes: 64000 }, { id: "E", votes: 40000 }, { id: "F", votes: 32000 }], 8);
  assert.deepEqual(r.allocation, { A: 4, B: 2, C: 1, D: 1 });
  assert.equal(dhondt([{ id: "A", votes: 7 }, { id: "B", votes: 7 }], 1).tie, true);
});

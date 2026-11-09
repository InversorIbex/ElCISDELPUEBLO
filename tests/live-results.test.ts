import test from "node:test";
import assert from "node:assert/strict";
import { buildLiveResults, dhondt, type CountInput } from "../lib/live-results.ts";
import { candidaciesForProvince } from "../lib/candidacies/registry.ts";
import { groupForCandidacy } from "../lib/party-groups.ts";
import { voteDbConfig } from "../lib/server/vote-db.ts";

const before = new Date("2026-11-10T12:00:00Z"); // fuera de la veda
const byGroup = (code: string, id: string) => candidaciesForProvince(code).find((c) => groupForCandidacy(c.officialName).id === id)!;
const row = (p: string, id: string, n: number): CountInput => ({ province_code: p, candidacy_id: id, n });

test("desde el primer voto: la provincia se colorea y muestra votos y %", () => {
  const pp = byGroup("27", "PP");
  const r = buildLiveResults([row("27", pp.id, 1)], { now: before });
  const lugo = r.provinces["27"];
  assert.equal(lugo.suppressed, null);
  assert.equal(lugo.winner?.groupId, "PP");
  assert.deepEqual([lugo.rows[0].n, lugo.rows[0].pct, lugo.rows[0].seats], [1, 100, 4]);
  assert.equal(r.totals.votes, 1);
  assert.equal(r.hemicycle.unassigned, 350 - 4);
});

test("reparte 38 escaños en Madrid y el hemiciclo suma 350", () => {
  const pp = byGroup("28", "PP"), psoe = byGroup("28", "PSOE");
  const r = buildLiveResults([row("28", pp.id, 6), row("28", psoe.id, 4)], { now: before });
  assert.equal(r.provinces["28"].winner?.groupId, "PP");
  assert.equal(r.provinces["28"].rows[0].pct, 60);
  assert.equal(r.provinces["28"].rows.reduce((s, x) => s + x.seats, 0), 38);
  assert.equal(r.hemicycle.groups.reduce((s, g) => s + g.seats, 0) + r.hemicycle.unassigned, 350);
});

test("empate: sin color de ganador", () => {
  const [a, b] = candidaciesForProvince("28");
  assert.equal(buildLiveResults([row("28", a.id, 3), row("28", b.id, 3)], { now: before }).provinces["28"].winner, null);
});

test("un mínimo configurado mayor que 1 sigue ocultando el reparto", () => {
  const soria = candidaciesForProvince("42")[0];
  assert.equal(buildLiveResults([row("42", soria.id, 10)], { minCount: 50, now: before }).provinces["42"].suppressed, "insufficient");
});

test("veda electoral: no devuelve resultados", () => {
  const [a] = candidaciesForProvince("28");
  const r = buildLiveResults([row("28", a.id, 5)], { now: new Date("2026-11-25T12:00:00Z") });
  assert.equal(r.blackout, true);
  assert.deepEqual(r.provinces, {});
});

test("D'Hondt: ejemplo del art. 163 LOREG y empate absoluto marcado", () => {
  const r = dhondt([{ id: "A", votes: 168000 }, { id: "B", votes: 104000 }, { id: "C", votes: 72000 }, { id: "D", votes: 64000 }, { id: "E", votes: 40000 }, { id: "F", votes: 32000 }], 8);
  assert.deepEqual(r.allocation, { A: 4, B: 2, C: 1, D: 1 });
  assert.equal(dhondt([{ id: "A", votes: 7 }, { id: "B", votes: 7 }], 1).tie, true);
});

test("agrupación nacional de candidaturas", () => {
  assert.equal(groupForCandidacy("PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA (PSOE) PSE-EE (PSOE)").id, "PSOE");
  assert.equal(groupForCandidacy("SE ACABÓ LA FIESTA (SALF)").id, "SALF");
  assert.ok(groupForCandidacy("PARTIDO ANIMALISTA CON EL MEDIO AMBIENTE (PACMA)").id.startsWith("OTRA:"));
});

test("conexión a Supabase: TLS verificado y sin sslmode en la URL", () => {
  const c = voteDbConfig("postgresql://u:p@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require", {});
  assert.equal((c.ssl as { rejectUnauthorized: boolean }).rejectUnauthorized, true);
  assert.ok(!String(c.connectionString).includes("sslmode"));
});

test("proyección: completa los 350 escaños con el reparto nacional y declara su base", () => {
  const pp = byGroup("28", "PP"), psoe = byGroup("28", "PSOE");
  const r = buildLiveResults([row("28", pp.id, 3), row("28", psoe.id, 1)], { now: before });
  const pr = r.projection;
  assert.equal(pr.basedOnVotes, 4);
  assert.equal(pr.ownProvinces, 1);
  assert.equal(pr.estimatedProvinces, 51);
  assert.equal(pr.groups.reduce((s, g) => s + g.seats, 0) + pr.unassigned, 350);
  assert.equal(pr.unassigned, 0);
  assert.ok(pr.groups.find((g) => g.id === "PP")!.seats > pr.groups.find((g) => g.id === "PSOE")!.seats);
});

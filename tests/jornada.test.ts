import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MAJORITY, PORRA_PARTIES, RESULT_2023, assigned, decodePrediction, emptyPrediction, encodePrediction, scorePrediction,
} from "../lib/porra.ts";
import { VOTE_WEIGHTS, byWeight, readableName, populationInfo } from "../lib/vote-weight.ts";
import { parseRecuento, publicRecuento } from "../lib/election-night.ts";
import { RECUENTO_SCHEMA_SQL } from "../lib/server/recuento.ts";
import { STATEMENTS, scoreAxes, profileLabel } from "../lib/brujula.ts";
import { seats2023ForProvince } from "../lib/ballot.ts";

test("porra: el punto de partida es el resultado oficial de 2023 y suma 350", () => {
  assert.equal(assigned(RESULT_2023), 350);
  assert.equal(RESULT_2023.PP, 137);
  assert.equal(RESULT_2023.PSOE, 121); // PSOE 102 + PSC 19
  assert.equal(RESULT_2023.VOX, 33);
  assert.equal(RESULT_2023.OTROS, 0);
});

test("porra: el enlace se codifica y decodifica sin pérdidas y rechaza porras inválidas", () => {
  const code = encodePrediction(RESULT_2023);
  assert.deepEqual(decodePrediction(code), RESULT_2023);
  assert.equal(decodePrediction("PP-200.PSOE-100"), null); // no suma 350
  assert.equal(decodePrediction("PP-350.PP-0"), null); // repetido
  assert.equal(decodePrediction("XX-350"), null);
  assert.equal(decodePrediction("PP-351"), null);
  assert.equal(decodePrediction("<script>"), null);
  assert.equal(decodePrediction(null), null);
  assert.equal(new Set(PORRA_PARTIES.map((p) => p.id)).size, PORRA_PARTIES.length);
});

test("porra: puntuación", () => {
  const perfect = scorePrediction(RESULT_2023, RESULT_2023);
  assert.deepEqual(perfect, { hits: 350, error: 0, winnerRight: true, majorityRight: true, points: 100 });
  const allPsoe = { ...emptyPrediction(), PSOE: 350 };
  const s = scorePrediction(allPsoe, RESULT_2023);
  assert.equal(s.hits, 121);
  assert.equal(s.winnerRight, false);
  assert.equal(s.majorityRight, false);
  assert.ok(MAJORITY === 176);
});

test("peso del voto: 52 circunscripciones con población oficial y orden coherente", () => {
  assert.equal(VOTE_WEIGHTS.length, 52);
  assert.equal(VOTE_WEIGHTS.reduce((s, w) => s + w.seats, 0), 350);
  assert.equal(VOTE_WEIGHTS.reduce((s, w) => s + w.population, 0), populationInfo.total);
  for (const w of VOTE_WEIGHTS) assert.ok(w.population > 0 && w.perSeat > 0, w.name);
  const ranked = byWeight();
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[51].vsHeaviest, 1);
  assert.equal(readableName(ranked[0].name), "Soria");
  assert.equal(readableName("Balears, Illes"), "Illes Balears");
  assert.equal(readableName("Coruña, A"), "A Coruña");
});

test("papeleta: los escaños de 2023 por provincia suman los de la circunscripción", () => {
  assert.equal(seats2023ForProvince("28").reduce((s, x) => s + x.seats, 0), 37);
  assert.equal(seats2023ForProvince("08").find((x) => x.id === "PSOE")?.seats, 13); // PSC
  assert.deepEqual(seats2023ForProvince("99"), []);
});

test("recuento: validación estricta de lo que carga el operador", () => {
  const ok = parseRecuento({ scrutinized: 50.5, turnout: 66, turnoutUpdates: [{ time: "14:00", pct: 36.1, pct2023: 37.7 }], parties: [{ id: "PP", seats: 100, votesPct: 32 }] });
  assert.equal(ok.parties[0].seats, 100);
  for (const bad of [
    null, [], { scrutinized: 101 }, { parties: [{ id: "XX", seats: 1 }] }, { parties: [{ id: "PP", seats: 1.5 }] },
    { parties: [{ id: "PP", seats: 300 }, { id: "PSOE", seats: 51 }] }, { parties: [{ id: "PP", seats: 1 }, { id: "PP", seats: 1 }] },
    { final: true, parties: [{ id: "PP", seats: 300 }] }, { turnoutUpdates: [{ time: "13:00", pct: 1 }] },
  ]) assert.throws(() => parseRecuento(bad));
});

test("recuento: antes de las 21:00 del 29-N no se publican escaños, solo participación", () => {
  const payload = parseRecuento({ scrutinized: 10, turnoutUpdates: [{ time: "18:00", pct: 55, pct2023: 53 }], parties: [{ id: "PP", seats: 40, votesPct: 30 }] });
  const before = publicRecuento(payload, true, new Date("2026-11-29T19:59:59Z"));
  assert.equal(before.status, "turnout");
  assert.deepEqual(before.parties, []);
  assert.equal(before.scrutinized, null);
  assert.equal(before.turnoutUpdates.length, 1);
  const after = publicRecuento(payload, true, new Date("2026-11-29T20:00:00Z"));
  assert.equal(after.status, "live");
  assert.equal(after.parties[0].name, "PP");
  assert.equal(publicRecuento(null, false).status, "waiting");
});

test("recuento: la migración y el esquema de arranque crean la misma tabla con RLS", () => {
  const migration = readFileSync("db/migrations/0007_election_night.sql", "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS poll_private\.election_night/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.ok(RECUENTO_SCHEMA_SQL.some((s) => s.includes("poll_private.election_night")));
});

test("brújula: ejes equilibrados y puntuación entre −1 y 1", () => {
  for (const axis of ["economia", "sociedad", "territorio"]) {
    const items = STATEMENTS.filter((s) => s.axis === axis);
    assert.equal(items.filter((s) => s.dir === 1).length, 3, axis);
    assert.equal(items.filter((s) => s.dir === -1).length, 3, axis);
  }
  // Estar «muy de acuerdo» con todo deja a la persona en el centro.
  const yes = scoreAxes(Object.fromEntries(STATEMENTS.map((s) => [s.id, 2])));
  assert.deepEqual(yes, { economia: 0, sociedad: 0, territorio: 0 });
  assert.equal(profileLabel(yes).title, "Centro");
  const left = scoreAxes(Object.fromEntries(STATEMENTS.map((s) => [s.id, (s.dir === -1 ? 2 : -2) as 2 | -2])));
  assert.equal(left.economia, -1);
  assert.equal(profileLabel(left).title, "Izquierda progresista");
  assert.equal(scoreAxes({}).economia, null);
});

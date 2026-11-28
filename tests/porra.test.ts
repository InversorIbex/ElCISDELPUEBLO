import test from "node:test";
import assert from "node:assert/strict";
import {
  PORRA_CLOSES_AT, PORRA_PARTIES, PORRA_RANKING_FROM, RESULT_2023, assigned, cleanAlias, decodePrediction,
  emptyPrediction, encodePrediction, isPorraOpen, rankEntries,
} from "../lib/porra.ts";
import { publicRecuento, recuentoAsPrediction } from "../lib/election-night.ts";
import { PORRA_SCHEMA_SQL } from "../lib/server/porra-entries.ts";

test("porra: Sumar no se presenta y sus escaños de 2023 pasan a Frente Amplio", () => {
  assert.ok(!PORRA_PARTIES.some((p) => p.id === "SUMAR"));
  assert.equal(RESULT_2023.FA, 31);
  assert.equal(assigned(RESULT_2023), 350);
});

test("porra: los enlaces antiguos con SUMAR siguen funcionando", () => {
  const old = "PP-150.PSOE-110.VOX-40.SUMAR-20.FA-10.OTROS-20";
  const p = decodePrediction(old)!;
  assert.ok(p);
  assert.equal(p.FA, 30);
  assert.equal(p.SUMAR, undefined);
  assert.equal(encodePrediction(p).includes("SUMAR"), false);
  assert.equal(decodePrediction("SUMAR-10.SUMAR-340"), null);
});

test("porra: apodos", () => {
  assert.equal(cleanAlias("  La  Vecina_5 "), "La Vecina_5");
  assert.equal(cleanAlias("Ñandú"), "Ñandú");
  for (const bad of ["a", "x".repeat(25), "<b>", "-hola", "miweb.com", "http x", 5, null])
    assert.equal(cleanAlias(bad), null, String(bad));
});

test("porra: clasificación por puntos, error y antigüedad", () => {
  const actual = { ...RESULT_2023 };
  const exact = encodePrediction(RESULT_2023);
  const off = encodePrediction({ ...RESULT_2023, PP: RESULT_2023.PP - 2, PSOE: RESULT_2023.PSOE + 2 });
  const r = rankEntries([
    { alias: "tarde", code: exact, at: "2026-11-29T10:00:00.000Z" },
    { alias: "casi", code: off, at: "2026-11-28T10:00:00.000Z" },
    { alias: "pronto", code: exact, at: "2026-11-28T09:00:00.000Z" },
    { alias: "rota", code: "XX-350", at: "2026-11-28T09:00:00.000Z" },
  ], actual);
  assert.deepEqual(r.map((x) => x.alias), ["pronto", "tarde", "casi"]);
  assert.equal(r[0].points, 100);
});

test("porra: plazos y recuento", () => {
  assert.ok(PORRA_CLOSES_AT < PORRA_RANKING_FROM);
  assert.equal(isPorraOpen(new Date("2026-11-29T18:59:00Z")), true);
  assert.equal(isPorraOpen(new Date("2026-11-29T19:00:00Z")), false);
  const payload = { updatedAt: "x", scrutinized: 50, turnout: 60, turnoutUpdates: [], final: false,
    parties: [{ id: "PP", seats: 150, votesPct: 33 }, { id: "PSOE", seats: 100, votesPct: 28 }] };
  assert.equal(recuentoAsPrediction(publicRecuento(payload, true, new Date("2026-11-29T19:30:00Z"))), null);
  const a = recuentoAsPrediction(publicRecuento(payload, true, new Date("2026-11-29T20:30:00Z")))!;
  assert.equal(a.PP, 150);
  assert.deepEqual(Object.keys(a).sort(), Object.keys(emptyPrediction()).sort());
  assert.ok(PORRA_SCHEMA_SQL.some((s) => s.includes("REVOKE ALL")));
});

test("porra: sin recuento se listan todas por orden de llegada y sin puntos", () => {
  const code = encodePrediction(RESULT_2023);
  const r = rankEntries([
    { alias: "segunda", code, at: "2026-11-28T10:00:00.000Z" },
    { alias: "primera", code, at: "2026-11-28T09:00:00.000Z" },
  ], null);
  assert.deepEqual(r.map((x) => x.alias), ["primera", "segunda"]);
  assert.equal(r[0].points, null);
});

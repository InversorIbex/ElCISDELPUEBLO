import test from "node:test";
import assert from "node:assert/strict";
import {
  assessRelease,
  summarizeResponses,
  type ResultCell,
} from "../lib/results.ts";
import { launchStatus } from "../lib/server/privacy-gates.ts";
import { POST as submit } from "../app/api/participaciones/route.ts";
import { POST as replace } from "../app/api/participaciones/corregir/route.ts";
import { POST as revoke } from "../app/api/participaciones/revocar/route.ts";
const cells: ResultCell[] = [
  { optionId: "a", label: "Sintética A", category: "candidacy", responses: 60 },
  { optionId: "b", label: "Sintética B", category: "candidacy", responses: 50 },
  { optionId: "blank", label: "Blanco", category: "blank", responses: 50 },
];
test("porcentajes mantienen separados candidaturas y total de respuestas", () => {
  const result = summarizeResponses(cells);
  assert.equal(result.total, 160);
  assert.equal(result.candidacyTotal, 110);
  assert.equal(result.cells[0].denominator, 110);
  assert.equal(result.cells[2].denominator, 160);
  assert.ok(Math.abs(result.cells[0].percentage! - (60 / 110) * 100) < 1e-10);
});
test("no inventar porcentajes sin denominador y rechazar agregados inválidos", () => {
  assert.equal(
    summarizeResponses([{ ...cells[0], responses: 0 }]).cells[0].percentage,
    null,
  );
  assert.throws(() => summarizeResponses([{ ...cells[0], responses: -1 }]));
  assert.throws(() => summarizeResponses([cells[0], cells[0]]));
});
test("no basta el total para publicar una categoría pequeña", () => {
  assert.equal(
    assessRelease({
      cells: [cells[0], { ...cells[1], responses: 1 }],
      campaignClosed: true,
      hasPreviousRelease: false,
      reviewed: true,
      level: "national",
    }).allowed,
    false,
  );
});
test("bloquear diferencias entre publicaciones, territorios y campañas abiertas", () => {
  for (const options of [
    {
      campaignClosed: false,
      hasPreviousRelease: false,
      level: "national" as const,
    },
    {
      campaignClosed: true,
      hasPreviousRelease: true,
      level: "national" as const,
    },
    {
      campaignClosed: true,
      hasPreviousRelease: false,
      level: "municipality" as const,
    },
    {
      campaignClosed: true,
      hasPreviousRelease: false,
      level: "province" as const,
    },
  ])
    assert.equal(
      assessRelease({ cells, ...options, reviewed: true }).allowed,
      false,
    );
  assert.equal(
    assessRelease({
      cells,
      campaignClosed: true,
      hasPreviousRelease: false,
      reviewed: false,
      level: "national",
    }).allowed,
    false,
  );
  assert.equal(
    assessRelease({
      cells,
      campaignClosed: true,
      hasPreviousRelease: false,
      reviewed: true,
      level: "national",
    }).allowed,
    true,
  );
});
test("el umbral no puede rebajarse por llamada", () => {
  assert.throws(() =>
    assessRelease({
      cells,
      campaignClosed: true,
      hasPreviousRelease: false,
      reviewed: true,
      level: "national",
      minimumSize: 1,
    }),
  );
});
test("ningún endpoint de participación está abierto ni necesita leer cuerpos", async () => {
  assert.equal(launchStatus().enabled, false);
  assert.ok(launchStatus().requirements.every((r) => r.state === "pending"));
  for (const handler of [submit, replace, revoke]) {
    const response = handler();
    assert.equal(response.status, 423);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal((await response.json()).enabled, false);
  }
});

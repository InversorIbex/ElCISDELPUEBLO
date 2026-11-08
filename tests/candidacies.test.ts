import test from "node:test";
import assert from "node:assert/strict";
import source from "../data/candidacies/congress-2026.json" with { type: "json" };
import {
  candidacies,
  candidaciesForProvince,
  isCandidacyAvailable,
  candidacyInfo,
} from "../lib/candidacies/registry.ts";
import { provinces } from "../lib/territories.ts";
import { GET } from "../app/api/candidaturas/route.ts";
test("534 candidaturas proclamadas, 52 circunscripciones y 21 no proclamadas excluidas", () => {
  assert.equal(candidacies.length, 534);
  assert.equal(source.excluded.length, 21);
  assert.equal(new Set(candidacies.map((c) => c.provinceCode)).size, 52);
  assert.equal(new Set(candidacies.map((c) => c.id)).size, 534);
  assert.equal(
    new Set(candidacies.map((c) => `${c.provinceCode}/${c.order}`)).size,
    534,
  );
  for (const p of provinces)
    assert.equal(
      candidaciesForProvince(p.code).length,
      source.provinceCounts[p.code as keyof typeof source.provinceCounts],
    );
});
test("solo Congreso, sin nombres de personas y conservando orden de proclamación", () => {
  for (const p of provinces) {
    const list = candidaciesForProvince(p.code);
    assert.ok(list.length);
    assert.deepEqual(
      list.map((c) => c.order),
      list.map((c) => c.order).sort((a, b) => a - b),
    );
    for (const c of list) {
      assert.equal(c.status, "proclaimed");
      assert.ok(!("candidates" in c));
      assert.ok(!c.officialName.includes("SENADO DE PROGRESO"));
    }
  }
  for (const e of source.excluded)
    assert.ok(!candidacies.some((c) => c.id === e.id));
});
test("corrección de Navarra cambia coalición y capitalización sin afectar Senado", () => {
  const navarra = candidaciesForProvince("31");
  assert.equal(
    navarra.find((c) => c.order === 1)?.officialName,
    "EUSKAL HERRIA BILDU (EH BILDU)",
  );
  assert.equal(
    navarra.find((c) => c.order === 11)?.officialName,
    "FRENTE AMPLIO-FRONTE ZABALA (FRENTE AMPLIO-FRONTE ZABALA)",
  );
  assert.equal(candidacies.filter((c) => c.correctionApplied).length, 2);
});
test("disponibilidad es específica de provincia, no una lista nacional para votar", () => {
  const lugo = candidaciesForProvince("27")[0];
  assert.equal(isCandidacyAvailable("27", lugo.id), true);
  assert.equal(isCandidacyAvailable("28", lugo.id), false);
  assert.deepEqual(candidaciesForProvince("99"), []);
});
test("cada importación conserva dos documentos oficiales y sus huellas", () => {
  assert.equal(candidacyInfo.asOf, "2026-11-08");
  for (const s of candidacyInfo.sources) {
    assert.ok(s.url.startsWith("https://www.boe.es/"));
    assert.match(s.sha256, /^[a-f0-9]{64}$/);
  }
});
test("API solo devuelve la circunscripción solicitada y nunca habilita recogida", async () => {
  const response = GET(
    new Request("https://local/api/candidaturas?provincia=27"),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.candidacies.length, 8);
  assert.ok(
    body.candidacies.every(
      (c: { provinceCode: string }) => c.provinceCode === "27",
    ),
  );
  assert.equal(body.participationEnabled, false);
  for (const query of ["", "?provincia=99", "?provincia=27027"])
    assert.equal(
      GET(new Request("https://local/api/candidaturas" + query)).status,
      400,
    );
});

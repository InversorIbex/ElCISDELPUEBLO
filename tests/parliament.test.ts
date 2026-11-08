import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateManualScenarios,
  hemicyclePoints,
} from "../lib/parliament.ts";
import result2023 from "../data/elections/congress-2023-results.json" with { type: "json" };
import election from "../data/elections/congress-2026.json" with { type: "json" };
import {
  createBrowserCredential,
  readBrowserCredential,
  clearBrowserCredential,
  campaignCredentialPath,
} from "../lib/server/browser-credential.ts";
const c1 = "c1234567-1234-1234-1234-123456789012",
  c2 = "c2345678-1234-1234-1234-123456789012";
test("resultados 2023 oficiales suman 350; cada circunscripción cuadra", () => {
  assert.equal(result2023.kind, "official_election_result");
  assert.equal(result2023.constituencies.length, 52);
  assert.equal(
    result2023.parties.reduce((n, p) => n + p.seats, 0),
    350,
  );
  for (const c of result2023.constituencies)
    assert.equal(
      Object.values(c.seats).reduce((a, b) => a + b, 0),
      c.totalSeats,
    );
  assert.equal(result2023.parties[0].seats, 137);
  assert.equal(result2023.parties[1].seats + result2023.parties[4].seats, 121);
});
test("hemiciclo: 350 puntos distintos y dentro del marco", () => {
  const points = hemicyclePoints(350);
  assert.equal(points.length, 350);
  assert.equal(new Set(points.map((p) => `${p.x}/${p.y}`)).size, 350);
  for (const p of points) {
    assert.ok(p.x >= 0 && p.x <= 420);
    assert.ok(p.y >= 0 && p.y <= 250);
  }
  assert.throws(() => hemicyclePoints(351));
});
test("una provincia no se extrapola a España; la sustitución no duplica escaños", () => {
  const scenario = { provinceCode: "27", allocation: { A: 2, B: 2 } };
  const one = aggregateManualScenarios([scenario], election.constituencies);
  assert.equal(one.assigned, 4);
  assert.equal(one.unassigned, 346);
  assert.equal(one.complete, false);
  assert.throws(() =>
    aggregateManualScenarios([scenario, scenario], election.constituencies),
  );
  assert.throws(() =>
    aggregateManualScenarios(
      [{ provinceCode: "27", allocation: { A: 350 } }],
      election.constituencies,
    ),
  );
});
test("cobertura completa solo si se modelizan las 52 circunscripciones", () => {
  const data = election.constituencies.map((c) => ({
    provinceCode: c.provinceCode,
    allocation: { A: c.seats },
  }));
  const full = aggregateManualScenarios(data, election.constituencies);
  assert.equal(full.complete, true);
  assert.equal(full.assigned, 350);
  assert.equal(full.unassigned, 0);
});
test("credencial de navegador aleatoria y restringida a la ruta de un sondeo", () => {
  const a = createBrowserCredential(c1),
    b = createBrowserCredential(c2);
  assert.notEqual(a.secret, b.secret);
  assert.ok(a.cookie.includes(`Path=${campaignCredentialPath(c1)}`));
  assert.ok(a.cookie.includes("HttpOnly; Secure; SameSite=Strict"));
  assert.ok(!a.cookie.includes("Max-Age"));
  assert.equal(readBrowserCredential(a.cookie), a.secret);
  assert.equal(
    readBrowserCredential(
      `__Secure-cis-response=${a.secret}; __Secure-cis-response=${b.secret}`,
    ),
    null,
  );
  assert.equal(readBrowserCredential("__Secure-cis-response=malformed"), null);
  assert.ok(
    createBrowserCredential(c1, true).cookie.includes("Max-Age=2592000"),
  );
  assert.ok(clearBrowserCredential(c1).includes("Max-Age=0"));
  assert.throws(() => campaignCredentialPath("../evil"));
});

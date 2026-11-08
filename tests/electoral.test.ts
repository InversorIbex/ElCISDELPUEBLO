import test from "node:test";
import assert from "node:assert/strict";
import { allocateSeats, parseManualWeight } from "../lib/electoral.ts";
import election from "../data/elections/congress-2026.json" with { type: "json" };
const input = {
  blank: 0,
  nullVotes: 0,
  seats: 8,
  system: "dhondt" as const,
  candidates: [168000, 104000, 72000, 64000, 40000, 32000].map((votes, i) => ({
    id: "ABCDEF"[i],
    votes,
  })),
};
test("ejemplo verificable LOREG art163: reparto 4,2,1,1,0,0", () => {
  const result = allocateSeats(input);
  assert.equal(result.status, "complete");
  assert.deepEqual(result.allocation, { A: 4, B: 2, C: 1, D: 1, E: 0, F: 0 });
  assert.equal(result.validVotes, 480000);
});
test("convocatoria 2026 verificada: 52 circunscripciones, 350 escaños y Ceuta/Melilla", () => {
  assert.equal(election.constituencies.length, 52);
  assert.equal(
    new Set(election.constituencies.map((c) => c.provinceCode)).size,
    52,
  );
  assert.equal(
    election.constituencies.reduce((n, c) => n + c.seats, 0),
    350,
  );
  assert.equal(
    election.constituencies.find((c) => c.provinceCode === "28")?.seats,
    38,
  );
  for (const code of ["51", "52"])
    assert.equal(
      election.constituencies.find((c) => c.provinceCode === code)?.system,
      "plurality",
    );
  assert.equal(election.candidaciesVerified, false);
});
test("el blanco sí altera el umbral, el nulo no", () => {
  const base = {
    candidates: [
      { id: "A", votes: 9700 },
      { id: "B", votes: 300 },
    ],
    blank: 0,
    nullVotes: 100000,
    seats: 2,
    system: "dhondt" as const,
  };
  assert.ok(!allocateSeats(base).excluded.includes("B"));
  assert.ok(allocateSeats({ ...base, blank: 1 }).excluded.includes("B"));
  assert.equal(allocateSeats(base).validVotes, 10000);
});
test("empate de cocientes se resuelve por mayor total de votos", () => {
  const result = allocateSeats({
    candidates: [
      { id: "A", votes: 200 },
      { id: "B", votes: 100 },
    ],
    blank: 0,
    nullVotes: 0,
    seats: 2,
    system: "dhondt",
  });
  assert.equal(result.status, "complete");
  assert.deepEqual(result.allocation, { A: 2, B: 0 });
});
test("empate en votos exige sorteo explícito y alterna después", () => {
  const base = {
    candidates: [
      { id: "A", votes: 100 },
      { id: "B", votes: 100 },
    ],
    blank: 0,
    nullVotes: 0,
    seats: 3,
    system: "dhondt" as const,
  };
  assert.equal(allocateSeats(base).status, "tie");
  const result = allocateSeats({ ...base, drawWinners: { "A|B": "B" } });
  assert.equal(result.status, "complete");
  assert.deepEqual(result.allocation, { A: 2, B: 1 });
  assert.deepEqual(
    result.trace.map((t) => t.candidate),
    ["B", "A", "A"],
  );
  assert.equal(
    allocateSeats({ ...base, drawWinners: { "A|B": "C" } }).status,
    "tie",
  );
});
test("empates de más de dos no se resuelven por orden alfabético", () => {
  const result = allocateSeats({
    candidates: [
      { id: "A", votes: 100 },
      { id: "B", votes: 100 },
      { id: "C", votes: 100 },
    ],
    blank: 0,
    nullVotes: 0,
    seats: 2,
    system: "dhondt",
  });
  assert.equal(result.status, "tie");
  assert.equal(result.tie?.manualDecisionSupported, false);
});
test("Ceuta y Melilla eligen por máximo sin umbral del 3%", () => {
  const result = allocateSeats({
    candidates: [
      { id: "A", votes: 2 },
      { id: "B", votes: 1 },
    ],
    blank: 10000,
    nullVotes: 0,
    seats: 1,
    system: "plurality",
  });
  assert.deepEqual(result.allocation, { A: 1, B: 0 });
  assert.equal(result.status, "complete");
  assert.equal(
    allocateSeats({
      candidates: [
        { id: "A", votes: 1 },
        { id: "B", votes: 1 },
      ],
      blank: 0,
      nullVotes: 0,
      seats: 1,
      system: "plurality",
    }).status,
    "tie",
  );
});
test("sin votos elegibles, no inventar escaños", () => {
  assert.equal(
    allocateSeats({ ...input, candidates: [{ id: "A", votes: 0 }], blank: 100 })
      .status,
    "empty",
  );
});
test("cálculo exacto con cifras grandes y rechazo de entradas inválidas", () => {
  const result = allocateSeats({
    ...input,
    candidates: [
      { id: "A", votes: 60000000000000 },
      { id: "B", votes: 40000000000000 },
    ],
    seats: 5,
  });
  assert.equal(result.status, "complete");
  assert.deepEqual(result.allocation, { A: 3, B: 2 });
  for (const bad of [
    { seats: 0 },
    { blank: -1 },
    { candidates: [{ id: "A", votes: 1.5 }] },
    { candidates: [{ id: "A", votes: NaN }] },
    {
      candidates: [
        { id: "A", votes: 1 },
        { id: "A", votes: 2 },
      ],
    },
  ])
    assert.throws(() => allocateSeats({ ...input, ...bad }));
});
test("porcentajes decimales se convierten a pesos enteros sin error flotante", () => {
  assert.equal(parseManualWeight("33,33", "percent"), 3333);
  assert.equal(parseManualWeight("100", "percent"), 10000);
  assert.equal(parseManualWeight("12", "votes"), 12);
  assert.equal(parseManualWeight("", "votes"), 0);
  for (const value of ["-1", "1e3", "12.345", "101", "Infinity"])
    assert.throws(() => parseManualWeight(value, "percent"));
  assert.throws(() => parseManualWeight("1.000", "votes"));
});

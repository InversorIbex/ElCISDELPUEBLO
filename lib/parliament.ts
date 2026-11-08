export type ManualDistrictScenario = {
  provinceCode: string;
  allocation: Record<string, number>;
};
export function aggregateManualScenarios(
  scenarios: ManualDistrictScenario[],
  constituencies: { provinceCode: string; seats: number }[],
) {
  const valid = new Map(constituencies.map((c) => [c.provinceCode, c.seats]));
  if (new Set(scenarios.map((s) => s.provinceCode)).size !== scenarios.length)
    throw new Error("DUPLICATE_CONSTITUENCY");
  const allocation: Record<string, number> = {};
  let assigned = 0;
  for (const scenario of scenarios) {
    const expected = valid.get(scenario.provinceCode);
    if (
      !expected ||
      Object.entries(scenario.allocation).some(
        ([id, n]) => !/^[A-L]$/.test(id) || !Number.isSafeInteger(n) || n < 0,
      ) ||
      Object.values(scenario.allocation).reduce((a, b) => a + b, 0) !== expected
    )
      throw new Error("INVALID_DISTRICT_SCENARIO");
    for (const [id, n] of Object.entries(scenario.allocation))
      allocation[id] = (allocation[id] ?? 0) + n;
    assigned += expected;
  }
  return {
    allocation,
    assigned,
    unassigned: 350 - assigned,
    coverage: scenarios.length,
    complete: scenarios.length === 52 && assigned === 350,
  };
}
// Filas concéntricas, ordenadas por ángulo. Cada punto corresponde a un solo escaño.
export function hemicyclePoints(total: number) {
  if (!Number.isInteger(total) || total < 1 || total > 350)
    throw new Error("INVALID_SEAT_TOTAL");
  const radii = [72, 89, 106, 123, 140, 157, 174, 191];
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.floor((total * r) / sum));
  let remaining = total - counts.reduce((a, b) => a + b, 0);
  for (
    let i = counts.length - 1;
    remaining > 0;
    i = (i + counts.length - 1) % counts.length
  ) {
    counts[i]++;
    remaining--;
  }
  const points: { x: number; y: number; angle: number }[] = [];
  radii.forEach((radius, row) => {
    for (let i = 0; i < counts[row]; i++) {
      const angle =
        counts[row] === 1 ? Math.PI / 2 : (Math.PI * i) / (counts[row] - 1);
      points.push({
        x: 210 - Math.cos(angle) * radius,
        y: 211 - Math.sin(angle) * radius,
        angle,
      });
    }
  });
  return points.sort((a, b) => a.angle - b.angle || a.y - b.y);
}

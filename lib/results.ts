export type ResultCategory =
  | "candidacy"
  | "blank"
  | "null"
  | "abstention"
  | "undecided"
  | "no_answer"
  | "topic";
export type ResultCell = {
  optionId: string;
  label: string;
  category: ResultCategory;
  responses: number;
};
export function summarizeResponses(cells: ResultCell[]) {
  if (
    new Set(cells.map((c) => c.optionId)).size !== cells.length ||
    cells.some((c) => !Number.isSafeInteger(c.responses) || c.responses < 0)
  )
    throw new Error("INVALID_AGGREGATE");
  const total = cells.reduce((s, c) => s + c.responses, 0);
  const candidacyTotal = cells
    .filter((c) => c.category === "candidacy")
    .reduce((s, c) => s + c.responses, 0);
  const topicTotal = cells
    .filter((c) => c.category === "topic")
    .reduce((s, c) => s + c.responses, 0);
  if (!Number.isSafeInteger(total)) throw new Error("INVALID_AGGREGATE");
  return {
    total,
    candidacyTotal,
    topicTotal,
    cells: cells.map((c) => ({
      ...c,
      denominator:
        c.category === "candidacy"
          ? candidacyTotal
          : c.category === "topic"
            ? topicTotal
            : total,
      denominatorLabel:
        c.category === "candidacy"
          ? "Respuestas a candidaturas"
          : c.category === "topic"
            ? "Respuestas temáticas"
            : "Todas las respuestas activas",
      percentage:
        (c.category === "candidacy"
          ? candidacyTotal
          : c.category === "topic"
            ? topicTotal
            : total) > 0
          ? (c.responses /
              (c.category === "candidacy"
                ? candidacyTotal
                : c.category === "topic"
                  ? topicTotal
                  : total)) *
            100
          : null,
    })),
  };
}
// Primera política deliberadamente limitada: una única publicación nacional al cierre.
// No permite ventanas móviles, municipios ni filtros cuyos resultados puedan restarse.
export function assessRelease(input: {
  cells: ResultCell[];
  campaignClosed: boolean;
  hasPreviousRelease: boolean;
  reviewed: boolean;
  level: "national" | "province" | "municipality";
  minimumSize?: number;
}) {
  const k = input.minimumSize ?? 50;
  if (!Number.isSafeInteger(k) || k < 50)
    throw new Error("INVALID_PRIVACY_THRESHOLD");
  const data = summarizeResponses(input.cells);
  if (!input.reviewed)
    return { allowed: false, reason: "PRIVACY_REVIEW_REQUIRED" } as const;
  if (
    !input.campaignClosed ||
    input.hasPreviousRelease ||
    input.level !== "national"
  )
    return { allowed: false, reason: "UNSUPPORTED_RELEASE_PATTERN" } as const;
  if (
    data.total < k ||
    data.cells.some((c) => c.responses > 0 && c.responses < k)
  )
    return { allowed: false, reason: "INSUFFICIENT_SAMPLE" } as const;
  return {
    allowed: true,
    data,
    metric: "closed_campaign_active_responses",
  } as const;
}

export type ManualCandidate = { id: string; votes: number };
export type AllocationInput = {
  candidates: ManualCandidate[];
  blank: number;
  nullVotes: number;
  seats: number;
  system: "dhondt" | "plurality";
  drawWinners?: Record<string, string>;
};
export type AllocationResult = {
  status: "complete" | "tie" | "empty";
  allocation: Record<string, number>;
  validVotes: number;
  nullVotes: number;
  excluded: string[];
  trace: {
    seat: number;
    candidate: string;
    numerator: number;
    divisor: number;
    quotient: number;
  }[];
  tie?: {
    key: string;
    candidates: string[];
    seat: number;
    manualDecisionSupported: boolean;
  };
};
export function parseManualWeight(
  value: string,
  mode: "votes" | "percent",
): number {
  const text = value.trim().replace(",", ".");
  if (text === "") return 0;
  if (mode === "votes") {
    if (!/^\d{1,12}$/.test(text))
      throw new Error("Introduce votos enteros sin separadores de miles.");
    const n = Number(text);
    if (!Number.isSafeInteger(n))
      throw new Error("Número de votos demasiado grande.");
    return n;
  }
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text))
    throw new Error("Introduce porcentajes con un máximo de dos decimales.");
  const [whole, decimals = ""] = text.split(".");
  const n = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
  if (n > 10000) throw new Error("Cada porcentaje debe estar entre 0 y 100.");
  return n;
}
export function allocateSeats(input: AllocationInput): AllocationResult {
  const { candidates, blank, nullVotes, seats, system } = input;
  if (
    !["dhondt", "plurality"].includes(system) ||
    !Number.isSafeInteger(seats) ||
    seats < 1 ||
    seats > 52 ||
    (system === "plurality" && seats !== 1)
  )
    throw new Error("INVALID_CONSTITUENCY");
  if (
    candidates.length < 1 ||
    candidates.length > 30 ||
    new Set(candidates.map((c) => c.id)).size !== candidates.length ||
    candidates.some((c) => !/^[A-Za-z0-9_-]{1,40}$/.test(c.id))
  )
    throw new Error("INVALID_CANDIDATES");
  for (const n of [blank, nullVotes, ...candidates.map((c) => c.votes)])
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("INVALID_VOTES");
  const validVotes = candidates.reduce((s, c) => s + c.votes, blank);
  if (
    !Number.isSafeInteger(validVotes) ||
    !Number.isSafeInteger(validVotes + nullVotes)
  )
    throw new Error("INVALID_VOTES");
  const allocation: Record<string, number> = Object.fromEntries(
    candidates.map((c) => [c.id, 0]),
  );
  const trace: AllocationResult["trace"] = [];
  const eligible = candidates.filter(
    (c) =>
      c.votes > 0 &&
      (system === "plurality" ||
        BigInt(c.votes) * 100n >= BigInt(validVotes) * 3n),
  );
  const excluded = candidates
    .filter((c) => !eligible.includes(c))
    .map((c) => c.id);
  const result: AllocationResult = {
    status: "complete",
    allocation,
    trace,
    validVotes,
    nullVotes,
    excluded,
  };
  if (!eligible.length) return { ...result, status: "empty" };
  const lastDrawWinner = new Map<string, string>();
  for (let seat = 1; seat <= seats; seat++) {
    const compare = (a: ManualCandidate, b: ManualCandidate) => {
      const left = BigInt(a.votes) * BigInt(allocation[b.id] + 1),
        right = BigInt(b.votes) * BigInt(allocation[a.id] + 1);
      if (left !== right) return left > right ? -1 : 1;
      return a.votes === b.votes ? 0 : a.votes > b.votes ? -1 : 1;
    };
    const ordered = [...eligible].sort(compare);
    const best = ordered[0];
    const tied = ordered.filter((c) => compare(best, c) === 0);
    let winner = best;
    if (tied.length > 1) {
      const ids = tied.map((c) => c.id).sort();
      const key = ids.join("|");
      const supported = system === "dhondt" && ids.length === 2;
      const previous = lastDrawWinner.get(key);
      const first = input.drawWinners?.[key];
      const chosen = supported
        ? previous
          ? ids.find((id) => id !== previous)
          : ids.includes(first ?? "")
            ? first
            : undefined
        : undefined;
      if (!chosen)
        return {
          ...result,
          status: "tie",
          tie: {
            key,
            candidates: ids,
            seat,
            manualDecisionSupported: supported,
          },
        };
      winner = tied.find((c) => c.id === chosen)!;
      lastDrawWinner.set(key, chosen);
    }
    const divisor = allocation[winner.id] + 1;
    allocation[winner.id]++;
    trace.push({
      seat,
      candidate: winner.id,
      numerator: winner.votes,
      divisor,
      quotient: winner.votes / divisor,
    });
  }
  return result;
}

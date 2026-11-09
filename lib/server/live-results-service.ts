import { buildLiveResults, type LiveResults } from "../live-results.ts";
import { readCounts } from "./public-vote.ts";
import { getVotePool } from "./vote-db.ts";

/** Votos mínimos para mostrar el reparto de una circunscripción. Por defecto 1 (desde el primer voto). */
export const resultsMinCount = () => Math.max(1, Number.parseInt(process.env.RESULTS_MIN_COUNT ?? "1", 10) || 1);

let cache: { at: number; value: LiveResults } | null = null;
const CACHE_MS = 5000;
export function invalidateLiveResults() { cache = null; }

export async function getLiveResults(): Promise<LiveResults> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const rows = await readCounts(getVotePool());
  const value = buildLiveResults(rows, { minCount: resultsMinCount() });
  cache = { at: Date.now(), value };
  return value;
}

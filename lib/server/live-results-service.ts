import { buildLiveResults, type LiveResults } from "../live-results.ts";
import { readCounts } from "./public-vote.ts";
import { getVotePool } from "./vote-db.ts";

export const simulationEnabled = () => process.env.SIMULATION_ENABLED === "true";
/** Umbral de publicación por circunscripción. Nunca por debajo de 50 (política de privacidad). */
export const resultsMinCount = () => Math.max(50, Number.parseInt(process.env.RESULTS_MIN_COUNT ?? "50", 10) || 50);

let cache: { at: number; value: LiveResults } | null = null;
const CACHE_MS = 5000;
export function invalidateLiveResults() { cache = null; }

export async function getLiveResults(): Promise<LiveResults> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const rows = await readCounts(getVotePool());
  const value = buildLiveResults(rows, { includeSimulated: simulationEnabled(), minCount: resultsMinCount() });
  cache = { at: Date.now(), value };
  return value;
}

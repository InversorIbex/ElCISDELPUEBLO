/**
 * Resultados en vivo del sondeo ciudadano (puro, sin acceso a base de datos).
 *
 * Reglas de publicación:
 * - Veda LOREG art. 69.7: durante la veda no se devuelve ningún resultado.
 * - Una circunscripción publica su reparto con al menos `minCount` votos.
 * - Supresión complementaria: el conjunto de circunscripciones con votos pero
 *   sin publicar debe sumar 0 o ≥ minCount (si no, el nacional menos lo
 *   publicado revelaría su reparto); se suprimen las publicadas más pequeñas.
 * - Dominancia: si una candidatura supera el 95 %, solo se publica el total.
 * - Los votos simulados (modo demostración) solo se suman si includeSimulated.
 * Porcentajes sobre votos a candidaturas de la circunscripción.
 */
import { candidaciesForProvince } from "./candidacies/registry.ts";
import { groupForCandidacy, HEMICYCLE_ORDER } from "./party-groups.ts";
import { inPollBlackout } from "./electoral-blackout.ts";
import election from "../data/elections/congress-2026.json" with { type: "json" };

export type CountInput = { province_code: string; candidacy_id: string; real_n: number; simulated_n: number };
export type Suppression = "insufficient" | "complementary" | "dominance" | null;
export type LiveRow = { id: string; name: string; groupId: string; groupName: string; color: string; n: number; pct: number; seats: number };
export type LiveProvince = {
  total: number; seats: number; suppressed: Suppression; tie?: boolean;
  winner: { groupId: string; name: string; color: string } | null;
  rows: LiveRow[];
};
export type LiveResults = {
  updatedAt: string;
  blackout: boolean;
  includeSimulated: boolean;
  minCount: number;
  totals: { real: number; simulated: number; shown: number };
  provinces: Record<string, LiveProvince>;
  hemicycle: { groups: { id: string; name: string; color: string; seats: number }[]; unassigned: number };
};

/**
 * D'Hondt con barrera del 3 % (art. 163 LOREG). Desempate: más votos; si el
 * empate es absoluto (la ley prevé sorteo) se resuelve por orden fijo de id y
 * se marca `tie` para no ocultar que es un desempate convencional.
 */
export function dhondt(options: readonly { id: string; votes: number }[], seats: number) {
  const valid = options.reduce((s, o) => s + o.votes, 0);
  const allocation: Record<string, number> = {};
  if (!valid) return { allocation, tie: false };
  const q = options.filter((o) => o.votes > 0 && o.votes * 100 >= valid * 3)
    .flatMap((o) => Array.from({ length: seats }, (_, d) => ({ id: o.id, q: o.votes / (d + 1), votes: o.votes })))
    .sort((a, b) => b.q - a.q || b.votes - a.votes || a.id.localeCompare(b.id));
  for (const w of q.slice(0, seats)) allocation[w.id] = (allocation[w.id] ?? 0) + 1;
  const last = q[seats - 1], next = q[seats];
  return { allocation, tie: Boolean(last && next && last.q === next.q && last.votes === next.votes && last.id !== next.id) };
}

const SEATS = new Map(election.constituencies.map((c) => [c.provinceCode, c.seats]));
const MAX_DOMINANT = 0.95;

export function buildLiveResults(rows: readonly CountInput[], opts: { includeSimulated: boolean; minCount: number; now?: Date }): LiveResults {
  const now = opts.now ?? new Date();
  let real = 0, simulated = 0;
  const byProvince = new Map<string, Map<string, number>>();
  for (const r of rows) {
    real += r.real_n; simulated += r.simulated_n;
    const n = r.real_n + (opts.includeSimulated ? r.simulated_n : 0);
    if (n <= 0) continue;
    const m = byProvince.get(r.province_code) ?? new Map<string, number>();
    m.set(r.candidacy_id, (m.get(r.candidacy_id) ?? 0) + n);
    byProvince.set(r.province_code, m);
  }
  const totals = { real, simulated, shown: real + (opts.includeSimulated ? simulated : 0) };
  const base = { updatedAt: now.toISOString(), includeSimulated: opts.includeSimulated, minCount: opts.minCount, totals };
  if (inPollBlackout(now))
    return { ...base, blackout: true, provinces: {}, hemicycle: { groups: [], unassigned: 350 } };

  const codes = [...SEATS.keys()].sort();
  const total = (c: string) => [...(byProvince.get(c)?.values() ?? [])].reduce((a, b) => a + b, 0);
  const status = new Map<string, Suppression>();
  let residual = 0, residualUnits = 0;
  for (const c of codes) {
    const t = total(c);
    if (t > 0 && t < opts.minCount) { status.set(c, "insufficient"); residual += t; residualUnits++; }
  }
  const candidatesForSecondary = codes.filter((c) => total(c) >= opts.minCount).sort((a, b) => total(a) - total(b) || a.localeCompare(b));
  for (let i = 0; residualUnits > 0 && residual < opts.minCount && i < candidatesForSecondary.length; i++) {
    const c = candidatesForSecondary[i];
    status.set(c, "complementary"); residual += total(c); residualUnits++;
  }

  const provinces: Record<string, LiveProvince> = {};
  const hemi = new Map<string, { id: string; name: string; color: string; seats: number }>();
  let unassigned = 0;
  for (const code of codes) {
    const seats = SEATS.get(code)!;
    const t = total(code);
    const counts = byProvince.get(code) ?? new Map<string, number>();
    let suppressed: Suppression = t === 0 ? "insufficient" : status.get(code) ?? null;
    if (!suppressed && Math.max(...counts.values()) > MAX_DOMINANT * t) suppressed = "dominance";
    if (suppressed) { provinces[code] = { total: t, seats, suppressed, winner: null, rows: [] }; unassigned += seats; continue; }

    const list = candidaciesForProvince(code).filter((c) => (counts.get(c.id) ?? 0) > 0);
    const alloc = dhondt(list.map((c) => ({ id: c.id, votes: counts.get(c.id)! })), seats);
    const assigned = Object.values(alloc.allocation).reduce((a, b) => a + b, 0);
    unassigned += seats - assigned;
    const out: LiveRow[] = list.map((c) => {
      const g = groupForCandidacy(c.officialName);
      const n = counts.get(c.id)!;
      return { id: c.id, name: c.officialName, groupId: g.id, groupName: g.name, color: g.color, n, pct: (n / t) * 100, seats: alloc.allocation[c.id] ?? 0 };
    }).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "es"));
    for (const r of out) if (r.seats > 0) {
      const h = hemi.get(r.groupId) ?? { id: r.groupId, name: r.groupName, color: r.color, seats: 0 };
      h.seats += r.seats; hemi.set(r.groupId, h);
    }
    const top = out[0];
    const tie = out.length > 1 && out[1].n === top.n;
    provinces[code] = { total: t, seats, suppressed: null, tie: alloc.tie, rows: out, winner: tie ? null : { groupId: top.groupId, name: top.groupName, color: top.color } };
  }
  const rank = (id: string) => { const i = HEMICYCLE_ORDER.indexOf(id); return i < 0 ? HEMICYCLE_ORDER.length : i; };
  const groups = [...hemi.values()].sort((a, b) => rank(a.id) - rank(b.id) || b.seats - a.seats);
  return { ...base, blackout: false, provinces, hemicycle: { groups, unassigned } };
}

/** 4 votos simulados por ejecución el primer día, ×2 cada día, con tope. */
export function simulatedVotesPerTick(start: Date, now: Date, base = 4, max = 512): number {
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
  return Math.min(max, base * 2 ** Math.min(days, 30));
}

/** Votos simulados: provincia ponderada por escaños y candidatura al azar entre las proclamadas. */
export function randomSimulatedVotes(n: number, rand: () => number = Math.random) {
  const entries = [...SEATS.entries()];
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  return Array.from({ length: n }, () => {
    let x = rand() * sum, code = entries[entries.length - 1][0];
    for (const [c, s] of entries) { if ((x -= s) < 0) { code = c; break; } }
    const list = candidaciesForProvince(code);
    return { provinceCode: code, candidacyId: list[Math.floor(rand() * list.length)].id };
  });
}

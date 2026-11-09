/**
 * Resultados en vivo del sondeo ciudadano (puro, sin acceso a base de datos).
 *
 * Reglas de publicación (decisión del promotor, 2026-11-09):
 * - Veda LOREG art. 69.7: durante la veda no se devuelve ningún resultado.
 * - Por defecto (`minCount` = 1) cada circunscripción muestra su reparto desde
 *   el primer voto. Si se configura un mínimo mayor, se aplican umbral,
 *   supresión complementaria y dominancia del 95 %.
 * Porcentajes sobre votos a candidaturas de la circunscripción.
 */
import { candidaciesForProvince } from "./candidacies/registry.ts";
import { groupForCandidacy, HEMICYCLE_ORDER } from "./party-groups.ts";
import { inPollBlackout } from "./electoral-blackout.ts";
import election from "../data/elections/congress-2026.json" with { type: "json" };

export type CountInput = { province_code: string; candidacy_id: string; n: number };
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
  minCount: number;
  totals: { votes: number };
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

export function buildLiveResults(rows: readonly CountInput[], opts: { minCount?: number; now?: Date } = {}): LiveResults {
  const now = opts.now ?? new Date();
  const minCount = Math.max(1, Math.floor(opts.minCount ?? 1));
  let votes = 0;
  const byProvince = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const n = r.n;
    if (n <= 0) continue;
    votes += n;
    const m = byProvince.get(r.province_code) ?? new Map<string, number>();
    m.set(r.candidacy_id, (m.get(r.candidacy_id) ?? 0) + n);
    byProvince.set(r.province_code, m);
  }
  const base = { updatedAt: now.toISOString(), minCount, totals: { votes } };
  if (inPollBlackout(now))
    return { ...base, blackout: true, provinces: {}, hemicycle: { groups: [], unassigned: 350 } };

  const codes = [...SEATS.keys()].sort();
  const total = (c: string) => [...(byProvince.get(c)?.values() ?? [])].reduce((a, b) => a + b, 0);
  const status = new Map<string, Suppression>();
  let residual = 0, residualUnits = 0;
  for (const c of codes) {
    const t = total(c);
    if (t > 0 && t < minCount) { status.set(c, "insufficient"); residual += t; residualUnits++; }
  }
  const candidatesForSecondary = codes.filter((c) => total(c) >= minCount).sort((a, b) => total(a) - total(b) || a.localeCompare(b));
  for (let i = 0; residualUnits > 0 && residual < minCount && i < candidatesForSecondary.length; i++) {
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
    if (!suppressed && minCount > 1 && Math.max(...counts.values()) > MAX_DOMINANT * t) suppressed = "dominance";
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

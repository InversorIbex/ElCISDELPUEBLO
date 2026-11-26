/**
 * Votación «¿Quién ganó el debate?» del debate a cuatro del 26-N de 2026.
 *
 * Es una pregunta sobre la actuación en el debate, no sobre intención de voto.
 * Decisión del promotor (2026-11-26): se publican los porcentajes de esta
 * votación durante la campaña; los resultados del sondeo de intención de voto
 * siguen sujetos a la veda de `lib/electoral-blackout.ts`.
 *
 * Nunca se publica el número de votos: solo el porcentaje de cada opción.
 */
export const DEBATE_ID = "debate-2026-11-26";
export const DEBATE_PATH = "/quien-gano-el-debate";
export const DEBATE_START = "2026-11-26T22:00:00+01:00";
export const DEBATE_END = "2026-11-27T00:00:00+01:00";
/** Sábado 28-N a las 23:59:59 en la península (CET, UTC+1). */
export const DEBATE_VOTE_CLOSES_AT = new Date("2026-11-28T22:59:59.999Z");

export type DebateOptionId = "sanchez" | "feijoo" | "abascal" | "colau" | "ninguno";
export type DebateOption = {
  id: DebateOptionId;
  name: string;
  party: string | null;
  partyName: string | null;
  photo: string | null;
  logo: string | null;
  color: string;
};

export const DEBATE_OPTIONS: readonly DebateOption[] = [
  { id: "sanchez", name: "Pedro Sánchez", party: "PSOE", partyName: "Partido Socialista Obrero Español", photo: "/debate/sanchez.jpg", logo: "/api/party-logo/psoe", color: "#e30613" },
  { id: "feijoo", name: "Alberto Núñez Feijóo", party: "PP", partyName: "Partido Popular", photo: "/debate/feijoo.jpg", logo: "/api/party-logo/pp", color: "#1e4b8f" },
  { id: "abascal", name: "Santiago Abascal", party: "Vox", partyName: "Vox", photo: "/debate/abascal.jpg", logo: "/api/party-logo/vox", color: "#4f9e2b" },
  { id: "colau", name: "Ada Colau", party: "Frente Amplio", partyName: "Frente Amplio", photo: "/debate/colau.jpg", logo: "/logos/frenteamplio.svg", color: "#f26a1b" },
  { id: "ninguno", name: "Ninguno", party: null, partyName: null, photo: null, logo: null, color: "#7a7f86" },
];

export const DEBATE_TOPICS = [
  "Vivienda",
  "Economía y fiscalidad",
  "Políticas sociales y servicios públicos",
  "Corrupción y regeneración democrática",
  "Migración y política exterior",
] as const;

export function isDebateOption(value: unknown): value is DebateOptionId {
  return typeof value === "string" && DEBATE_OPTIONS.some((o) => o.id === value);
}

export function isDebateVoteOpen(now = new Date()): boolean {
  return now.getTime() <= DEBATE_VOTE_CLOSES_AT.getTime();
}

export type DebateShares = {
  debateId: string;
  open: boolean;
  closesAt: string;
  hasVotes: boolean;
  /** Porcentaje con un decimal por opción. Suman 100,0 cuando hay votos. */
  shares: Record<DebateOptionId, number>;
};

/** Porcentajes con un decimal que suman exactamente 100,0 (mayor resto). */
export function debatePercentages(counts: Partial<Record<string, number>>): { hasVotes: boolean; shares: Record<DebateOptionId, number> } {
  const ids = DEBATE_OPTIONS.map((o) => o.id);
  const n = (id: string) => Math.max(0, Math.floor(Number(counts[id]) || 0));
  const total = ids.reduce((sum, id) => sum + n(id), 0);
  const shares = Object.fromEntries(ids.map((id) => [id, 0])) as Record<DebateOptionId, number>;
  if (!total) return { hasVotes: false, shares };
  const parts = ids.map((id) => {
    const exact = (n(id) * 1000) / total;
    return { id, tenths: Math.floor(exact), rest: exact - Math.floor(exact) };
  });
  let missing = 1000 - parts.reduce((sum, p) => sum + p.tenths, 0);
  for (const p of [...parts].sort((a, b) => b.rest - a.rest)) {
    if (missing <= 0) break;
    p.tenths += 1;
    missing -= 1;
  }
  for (const p of parts) shares[p.id] = p.tenths / 10;
  return { hasVotes: true, shares };
}

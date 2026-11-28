/**
 * La porra del hemiciclo: cada persona reparte los 350 escaños como cree que
 * quedarán el 29-N. Es una predicción individual, no un sondeo:
 * - Vive en el enlace que cada uno decide compartir.
 * - Quien quiera la apunta con un apodo para entrar en la clasificación. Las
 *   porras apuntadas no se publican ni se agregan hasta el cierre de los
 *   colegios (fin de la veda); después solo se publica la clasificación.
 * - Tras el escrutinio oficial se compara con el resultado.
 */
import { GROUPS, HEMICYCLE_ORDER, normalize } from "./party-groups.ts";
import { BLACKOUT_END } from "./electoral-blackout.ts";
import previous from "../data/elections/congress-2023-results.json" with { type: "json" };

export const TOTAL_SEATS = 350;
export const MAJORITY = 176;
export const PORRA_PATH = "/porra-elecciones-2026";
export const PORRA_RANKING_PATH = "/porra-elecciones-2026/clasificacion";
/** Se pueden apuntar porras hasta las 20:00 peninsulares, cuando salen los sondeos a pie de urna. */
export const PORRA_CLOSES_AT = new Date("2026-11-29T19:00:00Z");
/** La clasificación se publica al terminar la veda (21:00 peninsulares). */
export const PORRA_RANKING_FROM = BLACKOUT_END;
export const isPorraOpen = (now = new Date()) => now < PORRA_CLOSES_AT;

export type PorraParty = { id: string; name: string; color: string };

const OTHERS: PorraParty = { id: "OTROS", name: "Otros", color: "#8E959C" };

/**
 * Sumar no se presenta con marca propia el 29-N (BOE de candidaturas
 * proclamadas): su espacio concurre como Frente Amplio. Compromís y las
 * coaliciones canarias que lo citan cuentan en «Otros».
 */
const NOT_RUNNING = new Set(["SUMAR"]);
/** Grupo que hereda los escaños de 2023 y las porras antiguas de un partido que ya no se presenta. */
const SUCCESSOR: Record<string, string> = { SUMAR: "FA" };

/** Orden izquierda → derecha del hemiciclo, y «Otros» al final. */
export const PORRA_PARTIES: readonly PorraParty[] = [
  ...HEMICYCLE_ORDER.filter((id) => !NOT_RUNNING.has(id)).map((id) => {
    const g = GROUPS.find((x) => x.id === id)!;
    return { id: g.id, name: g.name, color: g.color };
  }),
  OTHERS,
];
const IDS = new Set(PORRA_PARTIES.map((p) => p.id));

export type Prediction = Record<string, number>;

export const emptyPrediction = (): Prediction =>
  Object.fromEntries(PORRA_PARTIES.map((p) => [p.id, 0]));

/** Resultado oficial de 2023 agrupado como en el resto de la web (punto de partida neutral). */
export const RESULT_2023: Prediction = (() => {
  const out = emptyPrediction();
  for (const party of previous.parties) {
    const n = normalize(party.name);
    const g = GROUPS.find((x) => x.re.test(n));
    const id = g ? (SUCCESSOR[g.id] ?? g.id) : OTHERS.id;
    out[IDS.has(id) ? id : OTHERS.id] += party.seats;
  }
  return out;
})();

export const assigned = (p: Prediction) => Object.values(p).reduce((a, b) => a + b, 0);
export const isComplete = (p: Prediction) => assigned(p) === TOTAL_SEATS;

/** Codifica la porra para el enlace: «PP-140.PSOE-110…», solo partidos con escaños. */
export function encodePrediction(p: Prediction): string {
  return PORRA_PARTIES.filter((x) => (p[x.id] ?? 0) > 0)
    .map((x) => `${x.id}-${p[x.id]}`)
    .join(".");
}

/**
 * Lee una porra del enlace. Devuelve null si no es válida o no suma 350.
 * Los enlaces antiguos con «SUMAR» siguen valiendo: sus escaños pasan a Frente Amplio.
 */
export function decodePrediction(text: string | null | undefined): Prediction | null {
  if (!text || text.length > 300) return null;
  const out = emptyPrediction();
  const seen = new Set<string>();
  for (const part of text.split(".")) {
    const m = /^([A-Z]{2,8})-(\d{1,3})$/.exec(part);
    if (!m || seen.has(m[1])) return null;
    seen.add(m[1]);
    const id = SUCCESSOR[m[1]] ?? m[1];
    if (!IDS.has(id)) return null;
    const n = Number(m[2]);
    if (n > TOTAL_SEATS) return null;
    out[id] += n;
  }
  return isComplete(out) ? out : null;
}

/** Apodo para la clasificación: 2-24 caracteres, letras, números, espacios y . _ - */
export function cleanAlias(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const alias = input.normalize("NFC").replace(/\s+/g, " ").trim();
  if (alias.length < 2 || alias.length > 24) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(alias)) return null;
  if (/https?|www\.|\.(com|es|net|org|eu)\b/i.test(alias)) return null;
  return alias;
}

/** points/hits/error son null mientras el recuento no tenga escaños. */
export type RankedEntry = { alias: string; code: string; points: number | null; hits: number | null; error: number | null; at: string };

/**
 * Clasificación: más puntos; a igualdad, menos escaños de error; y si sigue el
 * empate, quien la apuntó antes. Sin recuento, por orden de llegada.
 */
export function rankEntries(entries: { alias: string; code: string; at: string }[], actual: Prediction | null): RankedEntry[] {
  return entries
    .flatMap((e) => {
      const p = decodePrediction(e.code);
      if (!p) return [];
      const s = actual ? scorePrediction(p, actual) : null;
      return [{ alias: e.alias, code: encodePrediction(p), points: s?.points ?? null, hits: s?.hits ?? null, error: s?.error ?? null, at: e.at }];
    })
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (a.error ?? 0) - (b.error ?? 0) || a.at.localeCompare(b.at));
}

/** Partidos de la porra ordenados por escaños (para textos e imágenes). */
export function ranking(p: Prediction) {
  return PORRA_PARTIES.filter((x) => (p[x.id] ?? 0) > 0)
    .map((x) => ({ ...x, seats: p[x.id] }))
    .sort((a, b) => b.seats - a.seats);
}

export function summaryText(p: Prediction): string {
  const top = ranking(p).slice(0, 5).map((x) => `${x.name} ${x.seats}`).join(" · ");
  const first = ranking(p)[0];
  const majority = first && first.seats >= MAJORITY ? ` ${first.name} con mayoría absoluta.` : " Nadie llega a 176.";
  return `Mi porra del 29-N: ${top}.${majority}`;
}

export type PorraScore = {
  /** Escaños bien colocados: suma de min(predicción, resultado) por partido. */
  hits: number;
  /** Suma de diferencias absolutas por partido (0 = pleno). */
  error: number;
  winnerRight: boolean;
  majorityRight: boolean;
  /** Puntos sobre 100: escaños acertados y bonus por ganador y mayoría. */
  points: number;
};

export function scorePrediction(p: Prediction, actual: Prediction): PorraScore {
  let hits = 0;
  let error = 0;
  for (const { id } of PORRA_PARTIES) {
    const a = actual[id] ?? 0;
    const b = p[id] ?? 0;
    hits += Math.min(a, b);
    error += Math.abs(a - b);
  }
  const top = (x: Prediction) => ranking(x)[0]?.id ?? null;
  const winnerRight = top(p) !== null && top(p) === top(actual);
  const hasMajority = (x: Prediction) => (ranking(x)[0]?.seats ?? 0) >= MAJORITY;
  const majorityRight = hasMajority(p) === hasMajority(actual);
  const points = Math.round((hits / TOTAL_SEATS) * 80 + (winnerRight ? 12 : 0) + (majorityRight ? 8 : 0));
  return { hits, error, winnerRight, majorityRight, points };
}

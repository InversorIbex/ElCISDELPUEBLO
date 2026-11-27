/**
 * La porra del hemiciclo: cada persona reparte los 350 escaños como cree que
 * quedarán el 29-N. Es una predicción individual, no un sondeo:
 * - No se guarda en el servidor ni se agrega con las de otras personas.
 * - Vive en el navegador y en el enlace que cada uno decide compartir.
 * - Tras el escrutinio oficial se compara con el resultado (puntuación propia).
 */
import { GROUPS, HEMICYCLE_ORDER, normalize } from "./party-groups.ts";
import previous from "../data/elections/congress-2023-results.json" with { type: "json" };

export const TOTAL_SEATS = 350;
export const MAJORITY = 176;
export const PORRA_PATH = "/porra-elecciones-2026";

export type PorraParty = { id: string; name: string; color: string };

const OTHERS: PorraParty = { id: "OTROS", name: "Otros", color: "#8E959C" };

/** Orden izquierda → derecha del hemiciclo, y «Otros» al final. */
export const PORRA_PARTIES: readonly PorraParty[] = [
  ...HEMICYCLE_ORDER.map((id) => {
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
    out[g ? g.id : OTHERS.id] += party.seats;
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

/** Lee una porra del enlace. Devuelve null si no es válida o no suma 350. */
export function decodePrediction(text: string | null | undefined): Prediction | null {
  if (!text || text.length > 300) return null;
  const out = emptyPrediction();
  for (const part of text.split(".")) {
    const m = /^([A-Z]{2,8})-(\d{1,3})$/.exec(part);
    if (!m || !IDS.has(m[1])) return null;
    const n = Number(m[2]);
    if (n > TOTAL_SEATS || out[m[1]] !== 0) return null;
    out[m[1]] = n;
  }
  return isComplete(out) ? out : null;
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

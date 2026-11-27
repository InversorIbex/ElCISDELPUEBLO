/**
 * «¿Cuánto vale tu voto?»: habitantes empadronados por cada escaño del
 * Congreso en cada circunscripción. La LOREG (art. 162) da 2 escaños fijos a
 * cada provincia y 1 a Ceuta y a Melilla, y reparte el resto por población:
 * por eso un escaño cuesta muchos menos habitantes en Soria que en Madrid.
 *
 * Es aritmética con datos oficiales (INE y RD 806/2026), no una opinión.
 */
import election from "../data/elections/congress-2026.json" with { type: "json" };
import population from "../data/elections/population-2025.json" with { type: "json" };

export const VOTE_WEIGHT_PATH = "/cuanto-vale-mi-voto";
export const populationInfo = {
  reference: population.reference,
  source: population.source,
  notice: population.notice,
  total: population.total,
};

export type ProvinceWeight = {
  provinceCode: string;
  name: string;
  seats: number;
  population: number;
  /** Habitantes por escaño. */
  perSeat: number;
  /** Peso relativo frente a la media nacional (1 = media). */
  index: number;
  /** Cuántas veces pesa más que un voto de la circunscripción con más habitantes por escaño. */
  vsHeaviest: number;
  /** Puesto de 1 (más peso) a 52 (menos peso). */
  rank: number;
};

const pop = population.provinces as Record<string, number>;
const NATIONAL_PER_SEAT = population.total / 350;

const base = election.constituencies.map((c) => ({
  provinceCode: c.provinceCode,
  name: c.name,
  seats: c.seats,
  population: pop[c.provinceCode],
  perSeat: pop[c.provinceCode] / c.seats,
}));
const heaviest = Math.max(...base.map((b) => b.perSeat));
const order = [...base].sort((a, b) => a.perSeat - b.perSeat).map((b) => b.provinceCode);

export const VOTE_WEIGHTS: readonly ProvinceWeight[] = base.map((b) => ({
  ...b,
  perSeat: Math.round(b.perSeat),
  index: NATIONAL_PER_SEAT / b.perSeat,
  vsHeaviest: heaviest / b.perSeat,
  rank: order.indexOf(b.provinceCode) + 1,
}));

export const NATIONAL_AVERAGE_PER_SEAT = Math.round(NATIONAL_PER_SEAT);
export const weightFor = (code: string) => VOTE_WEIGHTS.find((w) => w.provinceCode === code) ?? null;
export const byWeight = () => [...VOTE_WEIGHTS].sort((a, b) => a.rank - b.rank);

/** Nombre legible: «Balears, Illes» → «Illes Balears», «Coruña, A» → «A Coruña». */
export function readableName(name: string) {
  const m = /^(.*), (A|As|Illes|La|Las|Los|O|Os|El)$/.exec(name);
  return m ? `${m[2]} ${m[1]}` : name;
}

const dec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
export const formatTimes = (n: number) => dec.format(n);
export const formatInt = (n: number) => n.toLocaleString("es-ES", { useGrouping: "always" } as Intl.NumberFormatOptions);

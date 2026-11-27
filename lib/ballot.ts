/**
 * «Tu papeleta»: lo que se vota en cada circunscripción. Solo datos oficiales:
 * escaños (RD 806/2026), resultado de 2023 (BOE) y candidaturas proclamadas.
 */
import previous from "../data/elections/congress-2023-results.json" with { type: "json" };
import { GROUPS, normalize } from "./party-groups.ts";

export const BALLOT_PATH = "/mi-papeleta";

export type Seats2023 = { id: string; name: string; color: string; seats: number }[];

/** Escaños de 2023 en una provincia, agrupados como en el resto de la web. */
export function seats2023ForProvince(code: string): Seats2023 {
  const row = previous.constituencies.find((c) => c.provinceCode === code);
  if (!row) return [];
  const out = new Map<string, Seats2023[number]>();
  for (const party of previous.parties) {
    const seats = (row.seats as Record<string, number>)[party.id] ?? 0;
    if (!seats) continue;
    const g = GROUPS.find((x) => x.re.test(normalize(party.name)));
    const key = g?.id ?? party.id;
    const prev = out.get(key);
    out.set(key, { id: key, name: g?.name ?? party.name, color: g?.color ?? "#8E959C", seats: (prev?.seats ?? 0) + seats });
  }
  return [...out.values()].sort((a, b) => b.seats - a.seats);
}

export const VOTER_GUIDE = [
  ["Cuándo", "Domingo 29 de noviembre de 2026, de 9:00 a 20:00. En Canarias, de 9:00 a 20:00 hora canaria."],
  ["Qué llevar", "El DNI, el pasaporte o el permiso de conducir, originales y con fotografía. No valen fotocopias."],
  ["Dónde", "Tu colegio y tu mesa dependen de tu domicilio en el censo. Compruébalo en la Oficina del Censo Electoral del INE."],
  ["Dos papeletas", "Papeleta y sobre blancos para el Congreso (listas cerradas). Papeleta y sobre sepia para el Senado, donde en la mayoría de provincias marcas hasta 3 nombres."],
  ["Si te toca mesa", "Preséntate a las 8:00 en tu colegio con la notificación. Es obligatorio salvo excusa aceptada por la Junta Electoral."],
] as const;

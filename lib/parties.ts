/**
 * Fichas nacionales de partidos para SEO: candidaturas proclamadas (BOE) que
 * se agrupan en cada fuerza política, sus escaños de 2023 y el enlace a su
 * resultado en el sondeo. Texto neutral: sin valoraciones ni programas.
 */
import { candidacies, type Candidacy } from "./candidacies/registry.ts";
import { GROUPS, groupForCandidacy, normalize, type PartyGroup } from "./party-groups.ts";
import previous from "../data/elections/congress-2023-results.json" with { type: "json" };
import { provinces } from "./territories.ts";

export type NationalParty = PartyGroup & {
  slug: string;
  fullName: string;
  candidacies: Candidacy[];
  provinceCodes: string[];
  seats2023: number | null;
};

const FULL_NAMES: Record<string, string> = {
  PSOE: "Partido Socialista Obrero Español (PSOE)", PP: "Partido Popular (PP)", VOX: "Vox",
  FA: "Frente Amplio", SUMAR: "Sumar", PODEMOS: "Podemos", SALF: "Se Acabó La Fiesta (SALF)",
  ERC: "Esquerra Republicana de Catalunya (ERC)", JUNTS: "Junts per Catalunya", BILDU: "EH Bildu",
  PNV: "EAJ-PNV (Partido Nacionalista Vasco)", BNG: "Bloque Nacionalista Galego (BNG)",
  CC: "Coalición Canaria (CC)", UPN: "Unión del Pueblo Navarro (UPN)",
};
const slugOf = (id: string) => id.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function seats2023(id: string): number | null {
  const g = GROUPS.find((x) => x.id === id);
  if (!g) return null;
  const hits = previous.parties.filter((p) => g.re.test(normalize(p.name)));
  return hits.length ? hits.reduce((s, p) => s + p.seats, 0) : null;
}

export const NATIONAL_PARTIES: readonly NationalParty[] = GROUPS.map((g) => {
  const list = candidacies.filter((c) => groupForCandidacy(c.officialName).id === g.id);
  return {
    id: g.id, name: g.name, color: g.color, slug: slugOf(g.id), fullName: FULL_NAMES[g.id] ?? g.name,
    candidacies: list,
    provinceCodes: [...new Set(list.map((c) => c.provinceCode))].sort(),
    seats2023: seats2023(g.id),
  };
}).filter((p) => p.candidacies.length > 0)
  .sort((a, b) => b.provinceCodes.length - a.provinceCodes.length || (b.seats2023 ?? 0) - (a.seats2023 ?? 0));

export const partyPath = (p: { slug: string }) => `/partidos/${p.slug}`;
export const partyBySlug = (slug: string) => NATIONAL_PARTIES.find((p) => p.slug === slug);
export const provinceName = (code: string) => provinces.find((p) => p.code === code)?.name ?? code;

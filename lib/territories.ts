import { normalize, displayName, slugify } from "./territory-format.ts";
export {
  normalize,
  displayName,
  slugify,
  municipalityPath,
} from "./territory-format.ts";
import catalog from "../data/territories/ine-2026.json" with { type: "json" };
import aliasData from "../data/territories/aliases.json" with { type: "json" };
export type Municipality = {
  code: string;
  name: string;
  provinceCode: string;
  communityCode: string;
};
export type Province = { code: string; name: string; communityCode: string };
export type Community = { code: string; name: string };
export const communities: Community[] = catalog.communities;
export const provinces: Province[] = catalog.provinces;
export const municipalities: Municipality[] = catalog.municipalities;
export const catalogInfo = {
  version: catalog.version,
  sources: catalog.sources,
  attribution: catalog.attribution,
  retrievedAt: catalog.retrievedAt,
};
const aliases: Record<string, string[]> = aliasData;
export const municipalityByCode = new Map(
  municipalities.map((m) => [m.code, m]),
);
export const provinceByCode = new Map(provinces.map((p) => [p.code, p]));
export const communityByCode = new Map(communities.map((c) => [c.code, c]));
const indexed = municipalities.map((m) => ({
  municipality: m,
  terms: [
    m.name,
    displayName(m.name),
    ...m.name.split("/"),
    ...(aliases[m.code] ?? []),
  ].map(normalize),
}));
export function searchMunicipalities(
  query: string,
  filters: { community?: string; province?: string } = {},
) {
  const q = normalize(query).slice(0, 100);
  if (q.length < 2) return [];
  const words = q.split(" ");
  return indexed
    .filter(
      ({ municipality: m, terms }) =>
        (!filters.community || m.communityCode === filters.community) &&
        (!filters.province || m.provinceCode === filters.province) &&
        (m.code === q || terms.some((t) => words.every((w) => t.includes(w)))),
    )
    .map(({ municipality: m, terms }) => ({
      m,
      rank:
        m.code === q || terms.includes(q)
          ? 0
          : terms.some((t) => t.startsWith(q))
            ? 1
            : 2,
    }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        displayName(a.m.name).localeCompare(displayName(b.m.name), "es") ||
        a.m.code.localeCompare(b.m.code),
    )
    .slice(0, 20)
    .map((x) => x.m);
}
export function provincePath(p: Province) {
  return `/provincia/${slugify(p.name)}`;
}
export function communityPath(c: Community) {
  return `/comunidad/${slugify(c.name)}`;
}

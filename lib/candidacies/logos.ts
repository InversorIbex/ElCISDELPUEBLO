import registry from "../../data/candidacies/logos.json" with { type: "json" };
import associationData from "../../data/candidacies/logo-associations.json" with { type: "json" };
import external from "../../data/candidacies/external-logo-sources.json" with { type: "json" };
const associations: Record<string, string> = associationData;
const byId = new Map(registry.logos.map((logo) => [logo.id, logo]));
const externalById = new Map(external.logos.map(logo => [logo.id,logo]));
// Only exact, checked names; do not silently turn coalition logos into constituent-party logos.
const additional: Readonly<Record<string,string>> = {
  "PARTIDO POPULAR (PP)": "pp",
  "Partido Popular (PP)": "pp",
  "PARTIT POPULAR / PARTIDO POPULAR (PP)": "pp",
  "PARTIDO SOCIALISTA OBRERO ESPAÑOL (PSOE)": "psoe",
  "PARTIDO SOCIALISTA DE HUELVA (PSOE)": "psoe",
  "VOX (VOX)": "vox",
  "VOX": "vox",
  "PODEMOS (PODEMOS)": "podemos",
  "PODEMOS": "podemos",
  "PARTIDO COMUNISTA DE LOS TRABAJADORES DE ESPAÑA (PCTE)": "pcte",
  "SE ACABÓ LA FIESTA (SALF)": "salf",
  "SE ACABO LA FIESTA (SALF)": "salf",
  "BLOQUE NACIONALISTA GALEGO (B.N.G.)": "bng",
  "BLOQUE NACIONALISTA GALEGO (BNG)": "bng",
  "JUNTS PER CATALUNYA (JxCat)": "junts",
  "ESQUERRA REPUBLICANA DE CATALUNYA (ERC)": "erc",
  "EUZKO ALDERDI JELTZALEA-PARTIDO NACIONALISTA VASCO (EAJ-PNV)": "pnv",
};
export const logoInfo = {
  asOf: external.reviewedAt,
  totalAssets: registry.logos.length + external.logos.length,
  notice: registry.notice + " " + external.notice,
};
export const logoAssets = [...registry.logos, ...external.logos];
export function logoForCandidacy(officialName: string) {
  const id = associations[officialName] ?? additional[officialName];
  return id ? (byId.get(id) ?? externalById.get(id)) : undefined;
}

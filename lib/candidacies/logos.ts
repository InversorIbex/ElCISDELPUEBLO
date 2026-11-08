import registry from "../../data/candidacies/logos.json" with { type: "json" };
import associationData from "../../data/candidacies/logo-associations.json" with { type: "json" };
const associations: Record<string, string> = associationData;
const byId = new Map(registry.logos.map((logo) => [logo.id, logo]));
export const logoInfo = {
  asOf: registry.asOf,
  totalAssets: registry.logos.length,
  notice: registry.notice,
};
export const logoAssets = registry.logos;
export function logoForCandidacy(officialName: string) {
  const id = associations[officialName];
  return id ? byId.get(id) : undefined;
}

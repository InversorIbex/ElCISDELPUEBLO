import registry from "../../data/candidacies/congress-2026.json" with { type: "json" };
export type Candidacy = (typeof registry.candidacies)[number];
export const candidacies: readonly Candidacy[] = registry.candidacies;
export const candidacyInfo = {
  asOf: registry.asOf,
  total: registry.totalProclaimed,
  excluded: registry.totalNotProclaimed,
  sources: registry.sources,
  notice: registry.notice,
};
const byProvince = new Map<string, Candidacy[]>();
for (const candidacy of candidacies) {
  const list = byProvince.get(candidacy.provinceCode) ?? [];
  list.push(candidacy);
  byProvince.set(candidacy.provinceCode, list);
}
export function candidaciesForProvince(code: string): readonly Candidacy[] {
  return byProvince.get(code) ?? [];
}
export function isCandidacyAvailable(provinceCode: string, id: string) {
  return candidaciesForProvince(provinceCode).some((c) => c.id === id);
}

import data from "../data/results/approved-provincial.json" with { type: "json" };
import { candidaciesForProvince } from "./candidacies/registry.ts";

export type ProvincialRelease = {
  provinceCode: string;
  publishedAt: string;
  reviewReference: string;
  totalResponses: number;
  candidacyResponses: number;
  counts: Record<string, number>;
};

/** Only publication-approved, aggregated snapshots belong here. Never raw ballots. */
const releases: readonly ProvincialRelease[] = data.releases as ProvincialRelease[];
function valid(release: ProvincialRelease): boolean {
  const available = new Set(candidaciesForProvince(release.provinceCode).map(c => c.id));
  if (!available.size || !/^REVIEW-[A-Za-z0-9-]{6,120}$/.test(release.reviewReference)) return false;
  if (!Number.isFinite(Date.parse(release.publishedAt))) return false;
  const counts = Object.entries(release.counts);
  if (counts.length !== available.size || !counts.every(([id, value]) =>
    available.has(id) && Number.isSafeInteger(value) && value >= 0)) return false;
  const sum = counts.reduce((a, [,v]) => a + v, 0);
  if (!Number.isSafeInteger(release.totalResponses) || !Number.isSafeInteger(release.candidacyResponses)) return false;
  if (release.totalResponses < release.candidacyResponses || sum !== release.candidacyResponses) return false;
  // Defense in depth: small nonzero cells may not appear in the public JSON.
  if (release.totalResponses < 50 || counts.some(([,v]) => v > 0 && v < 50)) return false;
  return true;
}
export function approvedProvinceResult(provinceCode: string): ProvincialRelease | null {
  const found = releases.filter(r => r.provinceCode === provinceCode);
  if (found.length !== 1) return null;
  return valid(found[0]) ? found[0] : null;
}
export function percent(value: number, denominator: number): number | null {
  return denominator > 0 ? (value / denominator) * 100 : null;
}

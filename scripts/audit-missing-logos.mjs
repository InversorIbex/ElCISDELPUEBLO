import { readFileSync } from "node:fs";
const catalog = JSON.parse(readFileSync(new URL("../data/candidacies/congress-2026.json", import.meta.url),"utf8"));
const assignments = JSON.parse(readFileSync(new URL("../data/candidacies/logo-associations.json", import.meta.url),"utf8"));
const logos = JSON.parse(readFileSync(new URL("../data/candidacies/logos.json", import.meta.url),"utf8"));
const known = new Set(logos.logos.map(l=>l.id));
const missing = catalog.candidacies.filter(c=>!known.has(assignments[c.officialName]));
const unique = [...new Set(missing.map(c=>c.officialName))].sort((a,b)=>a.localeCompare(b,"es"));
process.stdout.write(JSON.stringify({asOf:logos.asOf,totalCandidacies:catalog.candidacies.length,verifiedAssets:known.size,covered:catalog.candidacies.length-missing.length,missingOccurrences:missing.length,missingUniqueNames:unique.length,missingCandidacyNames:unique},null,2)+"\n");

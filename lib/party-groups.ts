/**
 * Agrupación nacional de candidaturas proclamadas para colorear el mapa y el
 * hemiciclo. Solo identificación visual (colores habituales en prensa), nunca
 * respaldo ni ranking. Una candidatura que no encaja en ningún grupo conocido
 * se muestra con su propio nombre y color neutro.
 */
export type PartyGroup = { id: string; name: string; color: string };
const GROUPS: readonly (PartyGroup & { re: RegExp })[] = [
  { id: "PSOE", name: "PSOE", color: "#E30613", re: /\b(PSOE|PSC|PSDEG|PSIB|PSN|PSE-EE)\b/ },
  { id: "PP", name: "PP", color: "#1D84CE", re: /\b(PP|PARTIDO POPULAR)\b/ },
  { id: "VOX", name: "Vox", color: "#63BE21", re: /\bVOX\b/ },
  { id: "FA", name: "Frente Amplio", color: "#D81B60", re: /FRENTE AMPLIO|FRONT AMPLI|FRONTE ZABALA|FRONTE AMPLA|\bCOMUNS\b/ },
  { id: "SUMAR", name: "Sumar", color: "#F06292", re: /\b(SUMAR|MAS MADRID|COMPROMIS)\b/ },
  { id: "PODEMOS", name: "Podemos", color: "#6B2E68", re: /\bPODEMOS\b/ },
  { id: "SALF", name: "SALF", color: "#5B5B5B", re: /SE ACABO LA FIESTA|\bSALF\b/ },
  { id: "ERC", name: "ERC", color: "#FFB232", re: /\b(ERC|ESQUERRA REPUBLICANA)\b/ },
  { id: "JUNTS", name: "Junts", color: "#00C3B2", re: /\bJUNTS\b/ },
  { id: "BILDU", name: "EH Bildu", color: "#B5CF18", re: /\bBILDU\b/ },
  { id: "PNV", name: "PNV", color: "#008E3C", re: /\b(PNV|EAJ)\b/ },
  { id: "BNG", name: "BNG", color: "#7FB3DD", re: /\b(BNG|BLOQUE NACIONALISTA GALEGO)\b/ },
  { id: "CC", name: "CC", color: "#F5C400", re: /COALICION CANARIA|\bCC\b/ },
  { id: "UPN", name: "UPN", color: "#2A52BE", re: /\bUPN\b|UNION DEL PUEBLO NAVARRO/ },
];
const OTHER_COLOR = "#8E959C";
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export function groupForCandidacy(officialName: string): PartyGroup {
  const n = normalize(officialName);
  // El orden importa: PODEMOS antes que SUMAR si la denominación es solo de Podemos.
  const hit = GROUPS.find((g) => g.id === "PODEMOS" && g.re.test(n) && !/\bSUMAR\b/.test(n))
    ?? GROUPS.find((g) => g.re.test(n));
  if (hit) return { id: hit.id, name: hit.name, color: hit.color };
  const short = officialName.replace(/\s*\(.*?\)\s*/g, " ").trim();
  return { id: `OTRA:${n.slice(0, 40)}`, name: short.length > 28 ? `${short.slice(0, 27)}…` : short, color: OTHER_COLOR };
}

/** Orden izquierda → derecha habitual en los diagramas del Congreso. */
export const HEMICYCLE_ORDER = ["PODEMOS", "FA", "SUMAR", "BILDU", "BNG", "ERC", "PSOE", "JUNTS", "PNV", "CC", "UPN", "PP", "SALF", "VOX"];

import { provinces } from "@/lib/territories";
import { candidaciesForProvince } from "@/lib/candidacies/registry";
import { approvedProvinceResult } from "@/lib/published-provincial";
import type { Winner } from "@/components/ProvinceMap";

/** Visual identification only, never endorsement/ranking. */
function colorFor(name:string):string {
  const n=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
  if(/\b(PSOE|PSC|PSDEG)\b/.test(n))return "#d53137";
  if(/\b(PP|PARTIDO POPULAR)\b/.test(n))return "#237ec8";
  if(/\bVOX\b/.test(n))return "#55a735";
  if(/\b(SUMAR|PODEMOS|MAS MADRID|COMPROMIS)\b/.test(n))return "#b554a0";
  if(/\b(ERC|ESQUERRA REPUBLICANA)\b/.test(n))return "#e9b437";
  if(/\b(JUNTS|JUNTS PER CATALUNYA)\b/.test(n))return "#19a6ab";
  if(/\b(PNV|EAJ)\b/.test(n))return "#397c53";
  if(/\b(BNG|BLOQUE NACIONALISTA)\b/.test(n))return "#75b5bf";
  return "#747487";
}
export function approvedProvincialWinners():Winner[] {
  return provinces.flatMap(province=>{
    const release=approvedProvinceResult(province.code);
    if(!release)return[];
    const entries=Object.entries(release.counts).sort((a,b)=>b[1]-a[1]);
    if(!entries.length||entries[0][1]===0)return[];
    if(entries.length>1 && entries[0][1]===entries[1][1])return[];
    const candidacy=candidaciesForProvince(province.code).find(c=>c.id===entries[0][0]);
    if(!candidacy)return[];
    return [{provinceCode:province.code,name:candidacy.officialName,
      color:colorFor(candidacy.officialName),responses:entries[0][1],total:release.totalResponses}];
  });
}

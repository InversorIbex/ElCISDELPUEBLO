import { notFound, redirect } from "next/navigation";
import { TerritoryPage } from "@/components/TerritoryPage";
import {
  municipalityByCode,
  provinceByCode,
  communityByCode,
  municipalityPath,
  provincePath,
  communityPath,
  displayName,
} from "@/lib/territories";
type Props = { params: Promise<{ code: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const m = municipalityByCode.get(code);
  return {
    title: m
      ? `${displayName(m.name)} · Municipio ${m.code}`
      : "Municipio no encontrado",
    description: m
      ? `Ficha territorial de ${displayName(m.name)}. Código INE ${m.code}. Sondeo abierto, sin resultados publicados.`
      : undefined,
  };
}
export default async function Page({ params }: Props) {
  const { code, slug } = await params;
  const m = municipalityByCode.get(code);
  if (!m) notFound();
  if (municipalityPath(m) !== `/municipio/${code}/${slug}`)
    redirect(municipalityPath(m));
  const p = provinceByCode.get(m.provinceCode)!;
  const c = communityByCode.get(m.communityCode)!;
  return (
    <TerritoryPage
      candidacyProvinceCode={m.provinceCode}
      name={m.name}
      kind="MUNICIPIO"
      code={m.code}
      breadcrumbs={[
        { name: c.name, href: communityPath(c) },
        { name: p.name, href: provincePath(p) },
        { name: m.name, href: municipalityPath(m) },
      ]}
    />
  );
}

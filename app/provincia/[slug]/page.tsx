import Link from "next/link";
import { notFound } from "next/navigation";
import { TerritoryPage } from "@/components/TerritoryPage";
import {
  provinces,
  municipalities,
  communityByCode,
  provincePath,
  communityPath,
  municipalityPath,
  slugify,
  displayName,
} from "@/lib/territories";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = provinces.find((p) => slugify(p.name) === slug);
  if (!p) return { title: "Provincia no encontrada", robots: { index: false, follow: false } };
  return {
    title: `Candidaturas al Congreso en ${displayName(p.name)} · 2026`,
    description: `Consulta candidaturas proclamadas en ${displayName(p.name)}, las fuentes oficiales y cómo se asignan sus escaños. Sondeo ciudadano voluntario e independiente.`,
    alternates: { canonical: provincePath(p) },
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = provinces.find((p) => slugify(p.name) === slug);
  if (!p) notFound();
  const c = communityByCode.get(p.communityCode)!;
  const list = municipalities
    .filter((m) => m.provinceCode === p.code)
    .sort((a, b) =>
      displayName(a.name).localeCompare(displayName(b.name), "es"),
    );
  return (
    <TerritoryPage
      candidacyProvinceCode={p.code}
      name={p.name}
      kind={["51", "52"].includes(p.code) ? "CIUDAD AUTÓNOMA" : "PROVINCIA"}
      code={p.code}
      municipalityCount={list.length}
      breadcrumbs={[
        { name: c.name, href: communityPath(c) },
        { name: p.name, href: provincePath(p) },
      ]}
    >
      <div className="directory-heading">
        <h2>Todos sus municipios</h2>
        <p>
          Catálogo oficial ·{" "}
          {list.length.toLocaleString("es-ES", { useGrouping: "always" })}{" "}
          municipios
        </p>
      </div>
      <div className="municipality-directory">
        {list.map((m) => (
          <Link key={m.code} href={municipalityPath(m)}>
            {displayName(m.name)}
            <span>{m.code} ↗</span>
          </Link>
        ))}
      </div>
    </TerritoryPage>
  );
}

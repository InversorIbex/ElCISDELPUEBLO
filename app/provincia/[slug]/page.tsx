import Link from "next/link";
import { notFound } from "next/navigation";
import { TerritoryPage } from "@/components/TerritoryPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import { candidaciesForProvince } from "@/lib/candidacies/registry";
import election from "@/data/elections/congress-2026.json";
const SEATS = new Map(election.constituencies.map((c) => [c.provinceCode, c.seats]));
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
  const n = displayName(p.name);
  const seats = SEATS.get(p.code);
  return {
    title: `Elecciones generales 2026 en ${n}: candidaturas, escaños y encuesta en vivo`,
    description: `¿A quién votarías en ${n} el 29 de noviembre? ${candidaciesForProvince(p.code).length} candidaturas proclamadas al Congreso${seats ? `, ${seats} ${seats === 1 ? "escaño" : "escaños"} en juego` : ""}. Vota en el sondeo ciudadano y mira los resultados de ${n} en vivo.`,
    keywords: [`elecciones ${n} 2026`, `encuesta ${n}`, `candidatos ${n} Congreso`, `sondeo elecciones ${n}`, `escaños ${n}`, `listas electorales ${n}`],
    alternates: { canonical: provincePath(p) },
    openGraph: { url: provincePath(p), title: `Elecciones generales 2026 en ${n}` },
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
  return (<>
    <JsonLd nodes={[breadcrumbLd([{ name: "Inicio", path: "/" }, { name: displayName(c.name), path: communityPath(c) }, { name: displayName(p.name), path: provincePath(p) }])]} />
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
  </>
  );
}

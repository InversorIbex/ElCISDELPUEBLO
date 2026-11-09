import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { LivePartyStats } from "@/components/LiveResults";
import { NATIONAL_PARTIES, partyBySlug, partyPath, provinceName } from "@/lib/parties";
import { displayName, provinceByCode, provincePath } from "@/lib/territories";
import { abs, breadcrumbLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return NATIONAL_PARTIES.map((p) => ({ slug: p.slug })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = partyBySlug((await params).slug);
  if (!p) return { title: "Partido no encontrado", robots: { index: false } };
  const where = p.provinceCodes.length === 52 ? "las 52 circunscripciones" : `${p.provinceCodes.length} circunscripciones`;
  return {
    title: `${p.name} en las elecciones generales 2026: candidaturas, escaños y sondeo`,
    description: `${p.fullName} se presenta en ${where} el 29 de noviembre de 2026. Consulta sus candidaturas oficiales por provincia${p.seats2023 != null ? `, sus ${p.seats2023} escaños de 2023` : ""} y cuántos votos lleva en el sondeo ciudadano en vivo.`,
    keywords: [`${p.name} elecciones 2026`, `${p.name} encuesta`, `${p.name} sondeo`, `${p.name} candidatos`, `votar ${p.name}`, `${p.name} escaños`],
    alternates: { canonical: partyPath(p) },
    openGraph: { url: partyPath(p), title: `${p.name} · Elecciones generales 2026` },
  };
}

export default async function Page({ params }: Props) {
  const p = partyBySlug((await params).slug);
  if (!p) notFound();
  return (
    <section className="page-section">
      <JsonLd nodes={[
        breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Partidos", path: "/partidos" }, { name: p.name, path: partyPath(p) }]),
        { "@type": ["Organization", "PoliticalParty"], name: p.fullName, alternateName: p.name, url: abs(partyPath(p)) },
      ]} />
      <div className="eyebrow"><Link href="/partidos">PARTIDOS</Link> · ELECCIONES GENERALES 2026</div>
      <h1><span style={{ color: p.color }} aria-hidden="true">● </span>{p.fullName}</h1>
      <p className="lead">
        {p.name} concurre al Congreso en {p.provinceCodes.length === 52 ? "las 52 circunscripciones" : `${p.provinceCodes.length} de las 52 circunscripciones`} en
        las elecciones generales del 29 de noviembre de 2026.
        {p.seats2023 != null && <> En las elecciones de julio de 2023 obtuvo {p.seats2023} escaños.</>}
      </p>
      <h2>{p.name} en el sondeo ciudadano, en vivo</h2>
      <LivePartyStats groupId={p.id} name={p.name} />
      <p><Link className="button" href="/participar">Votar en mi provincia ↗</Link>{" "}<Link className="text-link" href="/resultados">Ver el mapa de resultados →</Link></p>
      <h2>Candidaturas de {p.name} por circunscripción</h2>
      <p>Denominación oficial con la que figura en la papeleta de cada provincia, según la proclamación publicada en el BOE.</p>
      <div className="table-scroll">
        <table>
          <caption>Candidaturas proclamadas · Congreso 2026</caption>
          <thead><tr><th scope="col">Circunscripción</th><th scope="col">Nombre en la papeleta</th></tr></thead>
          <tbody>
            {[...p.candidacies].sort((a, b) => displayName(provinceName(a.provinceCode)).localeCompare(displayName(provinceName(b.provinceCode)), "es")).map((c) => {
              const prov = provinceByCode.get(c.provinceCode);
              return <tr key={c.id}>
                <th scope="row">{prov ? <Link href={provincePath(prov)}>{displayName(prov.name)}</Link> : c.provinceCode}</th>
                <td>{c.officialName}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <p className="denominator-note">
        Fuente: proclamación de candidaturas al Congreso (BOE). El sondeo es voluntario y no representativo; no es
        una encuesta oficial ni está vinculado al CIS.
      </p>
      <h2>Otros partidos</h2>
      <p>{NATIONAL_PARTIES.filter((x) => x.id !== p.id).map((x, i) => <span key={x.id}>{i ? " · " : ""}<Link href={partyPath(x)}>{x.name}</Link></span>)}</p>
    </section>
  );
}

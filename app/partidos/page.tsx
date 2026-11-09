import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { NATIONAL_PARTIES, partyPath } from "@/lib/parties";
import { abs, breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Partidos políticos en las elecciones generales 2026: candidaturas y sondeo",
  description: "Todos los partidos que se presentan a las elecciones generales del 29 de noviembre de 2026: PP, PSOE, Vox, Frente Amplio, Podemos, SALF, Sumar, ERC, Junts, EH Bildu, PNV, BNG y CC. Dónde se presentan, escaños de 2023 y votos en el sondeo ciudadano.",
  alternates: { canonical: "/partidos" },
  openGraph: { url: "/partidos", title: "Partidos políticos · Elecciones generales 2026" },
};

export default function Page() {
  return (
    <section className="page-section">
      <JsonLd nodes={[
        breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Partidos", path: "/partidos" }]),
        { "@type": "ItemList", name: "Partidos en las elecciones generales 2026", itemListElement: NATIONAL_PARTIES.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(partyPath(p)), name: p.fullName })) },
      ]} />
      <div className="eyebrow">ELECCIONES GENERALES · 29 DE NOVIEMBRE DE 2026</div>
      <h1>Partidos políticos en las elecciones generales 2026</h1>
      <p className="lead">
        Qué partidos se presentan al Congreso, en cuántas circunscripciones, cuántos escaños obtuvieron en 2023 y
        cómo van en el sondeo ciudadano. Datos de candidaturas: proclamación oficial publicada en el BOE.
      </p>
      <div className="community-grid">
        {NATIONAL_PARTIES.map((p) => (
          <Link key={p.id} href={partyPath(p)}>
            <span className="community-code" style={{ color: p.color }}>●</span>
            <h2 style={{ fontSize: "1.3rem", margin: ".3rem 0" }}>{p.fullName}</h2>
            <span className="community-count">
              Se presenta en {p.provinceCodes.length} de 52 circunscripciones
              {p.seats2023 != null ? ` · ${p.seats2023} escaños en 2023` : ""}
            </span>
            <span className="community-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
      <p className="denominator-note">
        Agrupamos las candidaturas por su denominación oficial para facilitar la consulta; algunas coaliciones
        territoriales incluyen a varios partidos. Hay más candidaturas en <Link href="/candidaturas">el listado completo por provincia</Link>.
      </p>
    </section>
  );
}

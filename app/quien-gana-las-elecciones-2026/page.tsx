import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { LiveLeaderSummary, LiveResultsSection } from "@/components/LiveResults";
import { ShareButtons } from "@/components/ShareButtons";
import { NATIONAL_PARTIES, partyPath } from "@/lib/parties";
import { displayName, provinces } from "@/lib/territories";
import { breadcrumbLd, faqLd } from "@/lib/seo";

const PATH = "/quien-gana-las-elecciones-2026";
export const metadata: Metadata = {
  title: "¿Quién ganará las elecciones generales 2026? Sondeo y escaños en vivo",
  description: "¿Quién va ganando las elecciones del 29 de noviembre de 2026? Mira en vivo qué partido lidera el sondeo ciudadano, quién gana en cada provincia y cuántos escaños tendría en el Congreso. Siempre con el número de votos.",
  keywords: ["quién ganará las elecciones 2026", "quién va a ganar las elecciones generales", "quién gana las elecciones 29N", "encuesta quién gana elecciones", "PP o PSOE encuesta 2026", "mayoría absoluta 2026"],
  alternates: { canonical: PATH },
  openGraph: { url: PATH, title: "¿Quién ganará las elecciones generales 2026?" },
};
const FAQ = [
  ["¿Quién ganará las elecciones generales de 2026?", "Nadie lo sabe hasta el recuento del 29 de noviembre. Esta página muestra quién lidera el sondeo voluntario de esta web y su proyección de escaños, siempre con el número de votos en que se basa. No es una predicción."],
  ["¿Cuántos escaños hacen falta para gobernar con mayoría absoluta?", "176 de los 350 diputados del Congreso."],
  ["¿Cómo se calcula la proyección?", "Ley D'Hondt con barrera del 3 % en cada provincia con votos; en las provincias sin votos, los escaños se reparten a partes iguales entre los partidos que ya tienen votos en el sondeo y se presentan allí."],
] as const;

export default function Page() {
  return (
    <section className="page-section">
      <JsonLd nodes={[breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "¿Quién ganará las elecciones 2026?", path: PATH }]), faqLd(FAQ)]} />
      <div className="eyebrow">ELECCIONES GENERALES · 29 DE NOVIEMBRE DE 2026</div>
      <h1>¿Quién ganará las elecciones generales 2026?</h1>
      <p className="lead">Así va el sondeo ciudadano ahora mismo. Cada voto cuenta y se actualiza en directo.</p>
      <LiveLeaderSummary />
      <p><Link className="button" href="/participar">Vota tú también ↗</Link></p>
      <ShareButtons path={PATH} text="¿Quién ganará las elecciones del 29-N? Mira el sondeo ciudadano en vivo y vota:" />
      <LiveResultsSection provinces={provinces.map((p) => ({ code: p.code, name: displayName(p.name) }))} />
      <h2>Cómo va cada partido</h2>
      <p>{NATIONAL_PARTIES.map((p, i) => <span key={p.id}>{i ? " · " : ""}<Link href={partyPath(p)}>{p.name}</Link></span>)}</p>
      <h2>Preguntas frecuentes</h2>
      <div className="faq-list">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      <p className="denominator-note">Sondeo voluntario de internautas, independiente y no representativo. No es una encuesta oficial ni está vinculado al CIS.</p>
    </section>
  );
}

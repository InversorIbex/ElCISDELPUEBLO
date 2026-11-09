import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { LiveLeaderSummary, LiveResultsSection } from "@/components/LiveResults";
import { ShareButtons } from "@/components/ShareButtons";
import { NATIONAL_PARTIES, partyPath } from "@/lib/parties";
import { communities, displayName, provinces, provincePath } from "@/lib/territories";
import { breadcrumbLd, electionEventLd, faqLd } from "@/lib/seo";
import election from "@/data/elections/congress-2026.json";

const PATH = "/encuesta-elecciones-generales-2026";
export const metadata: Metadata = {
  title: "Encuesta elecciones generales 2026: sondeo en vivo, escaños y partidos",
  description: "Encuesta ciudadana de las elecciones generales del 29 de noviembre de 2026. Vota, mira en vivo el partido más votado en cada provincia y la proyección de escaños del Congreso. PP, PSOE, Vox, Frente Amplio, Podemos, SALF y todos los partidos.",
  keywords: ["encuesta elecciones generales 2026", "sondeo elecciones generales 2026", "encuesta 29N", "intención de voto 2026", "quién ganará las elecciones 2026", "proyección escaños 2026", "encuesta PP PSOE Vox"],
  alternates: { canonical: PATH },
  openGraph: { url: PATH, title: "Encuesta elecciones generales 2026 · Resultados en vivo" },
};

const FAQ = [
  ["¿Cuándo son las elecciones generales de 2026?", "El domingo 29 de noviembre de 2026, convocadas por el Real Decreto 806/2026 (BOE de 6 de octubre de 2026)."],
  ["¿Cuántos escaños hacen falta para gobernar?", "La mayoría absoluta del Congreso son 176 de 350 diputados. Para la investidura en primera votación se necesita esa mayoría absoluta; en segunda, basta con más síes que noes."],
  ["¿Cómo se reparten los escaños?", "En cada una de las 52 circunscripciones se aplica la ley D'Hondt entre las candidaturas que superan el 3 % de los votos válidos de esa provincia."],
  ["¿Esta encuesta es oficial o representativa?", "No. Es un sondeo voluntario de internautas, independiente y sin vínculo con el CIS. Muestra lo que votan quienes participan, siempre con el número de votos, pero no es una muestra representativa ni una predicción."],
  ["¿Por qué no hay resultados del 24 al 29 de noviembre?", "La LOREG prohíbe difundir sondeos electorales los cinco días anteriores a la votación. Puedes seguir votando y los resultados vuelven tras el cierre de los colegios."],
] as const;

export default function Page() {
  const byCommunity = communities.map((c) => ({ c, list: provinces.filter((p) => p.communityCode === c.code) }));
  const seats = new Map(election.constituencies.map((x) => [x.provinceCode, x.seats]));
  return (
    <section className="page-section">
      <JsonLd nodes={[
        breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Encuesta elecciones generales 2026", path: PATH }]),
        electionEventLd, faqLd(FAQ),
      ]} />
      <div className="eyebrow">ELECCIONES GENERALES · DOMINGO 29 DE NOVIEMBRE DE 2026</div>
      <h1>Encuesta de las elecciones generales 2026</h1>
      <p className="lead">
        ¿A quién votarías si hoy fueran las elecciones? Vota en tu provincia y mira en vivo qué partido gana en cada
        circunscripción y cómo quedaría el Congreso de los Diputados. Todos los datos indican con cuántos votos están
        calculados.
      </p>
      <LiveLeaderSummary />
      <p><Link className="button" href="/participar">Votar ahora ↗</Link>{" "}<Link className="text-link" href="/quien-gana-las-elecciones-2026">¿Quién ganará? →</Link></p>
      <ShareButtons path={PATH} text="Encuesta de las elecciones generales del 29-N: vota y mira los resultados en vivo." />

      <LiveResultsSection provinces={provinces.map((p) => ({ code: p.code, name: displayName(p.name) }))} />

      <h2>Claves de las elecciones generales del 29-N</h2>
      <ul>
        <li><strong>Fecha:</strong> domingo 29 de noviembre de 2026 (Real Decreto 806/2026, BOE de 6 de octubre).</li>
        <li><strong>Congreso:</strong> 350 diputados en 52 circunscripciones; mayoría absoluta, 176.</li>
        <li><strong>Reparto:</strong> ley D&apos;Hondt por provincia con barrera del 3 %. Madrid elige {seats.get("28")} diputados, Barcelona {seats.get("08")}; Soria {seats.get("42")}; Ceuta y Melilla, 1 cada una.</li>
        <li><strong>Veda de sondeos:</strong> del 24 al 29 de noviembre no se pueden difundir encuestas (LOREG, art. 69.7).</li>
      </ul>

      <h2>Partidos y candidaturas</h2>
      <p>
        {NATIONAL_PARTIES.map((p, i) => <span key={p.id}>{i ? " · " : ""}<Link href={partyPath(p)}>{p.name}</Link></span>)}
        {" "}· <Link href="/candidaturas">todas las candidaturas por provincia</Link>
      </p>

      <h2>Encuesta por provincias</h2>
      <div className="seo-province-grid">
        {byCommunity.map(({ c, list }) => (
          <div key={c.code}>
            <h3>{displayName(c.name)}</h3>
            <p>{list.map((p, i) => <span key={p.code}>{i ? " · " : ""}<Link href={provincePath(p)}>{displayName(p.name)}</Link> ({seats.get(p.code)})</span>)}</p>
          </div>
        ))}
      </div>

      <h2>Preguntas frecuentes</h2>
      <div className="faq-list">
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </div>
      <p className="denominator-note">
        Sondeo voluntario de internautas, independiente y no representativo. No es una encuesta oficial ni está
        vinculado al CIS, al Gobierno ni a la administración electoral.
      </p>
    </section>
  );
}

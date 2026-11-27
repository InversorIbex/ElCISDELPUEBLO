import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { DebatePoll } from "@/components/DebatePoll";
import { DEBATE_OPTIONS, DEBATE_PATH, DEBATE_TOPICS } from "@/lib/debate";
import { NATIONAL_PARTIES, partyPath } from "@/lib/parties";
import { breadcrumbLd, debateEventLd, faqLd } from "@/lib/seo";

const TITLE = "¿Quién ganó el debate a cuatro? Sánchez, Feijóo, Abascal o Colau";
const DESCRIPTION =
  "Debate electoral de las elecciones generales del 29-N (26 de noviembre de 2026): Pedro Sánchez (PSOE), Alberto Núñez Feijóo (PP), Santiago Abascal (Vox) y Ada Colau (Frente Amplio). La votación ya está cerrada: el resultado se publica tras la veda electoral, a las 21:00 del 29-N.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "quién ganó el debate", "quién ha ganado el debate", "debate a cuatro", "debate electoral 2026",
    "debate 26 de noviembre", "encuesta debate", "ganador del debate electoral", "debate RTVE",
    "Pedro Sánchez", "Alberto Núñez Feijóo", "Santiago Abascal", "Ada Colau",
    "PSOE", "PP", "Vox", "Frente Amplio", "candidatos elecciones generales 2026",
  ],
  alternates: { canonical: DEBATE_PATH },
  openGraph: {
    type: "website",
    url: DEBATE_PATH,
    title: TITLE,
    description: "Quién ganó el debate electoral del 26-N según los internautas: resultado a partir de las 21:00 del 29-N.",
    images: [{ url: "/debate/og-debate.jpg", width: 1200, height: 630, alt: "Pedro Sánchez, Alberto Núñez Feijóo, Santiago Abascal y Ada Colau: ¿quién ganó el debate?" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Quién ganó el debate electoral del 26-N: resultado a partir de las 21:00 del 29-N.",
    images: ["/debate/og-debate.jpg"],
  },
};

const FAQ = [
  ["¿Cuándo es el debate a cuatro?", "El jueves 26 de noviembre de 2026 a las 22:00, tres días antes de las elecciones generales del domingo 29 de noviembre, en TVE, el Canal 24 Horas y RTVE Play."],
  ["¿Quiénes participaron en el debate?", "Pedro Sánchez (PSOE), Alberto Núñez Feijóo (PP), Santiago Abascal (Vox) y Ada Colau (Frente Amplio)."],
  ["¿De qué se habló en el debate?", `El debate se dividió en cinco bloques: ${DEBATE_TOPICS.join(", ").toLowerCase()}.`],
  ["¿Hasta cuándo se pudo votar quién ganó el debate?", "Hasta el final de la campaña, el viernes 27 de noviembre de 2026 a las 23:59 (hora peninsular). El resultado se publica a partir de las 21:00 del domingo 29-N, cuando termina la veda electoral."],
  ["¿Es una encuesta de intención de voto?", "No. Solo pregunta quién crees que lo hizo mejor en el debate. Es una votación voluntaria de internautas, no representativa, y solo se publica el porcentaje de cada opción, nunca el número de votos."],
] as const;

export default function Page() {
  const partyLink = (id: string) => NATIONAL_PARTIES.find((p) => p.id === id);
  const ids: Record<string, string> = { sanchez: "PSOE", feijoo: "PP", abascal: "VOX", colau: "FA" };
  return (
    <>
      <JsonLd nodes={[
        breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "¿Quién ganó el debate?", path: DEBATE_PATH }]),
        faqLd(FAQ),
        debateEventLd,
      ]} />
      <DebatePoll headingLevel={1} showPageLink={false} />
      <section className="page-section">
        <div className="eyebrow">DEBATE ELECTORAL · JUEVES 26 DE NOVIEMBRE DE 2026 · 22:00</div>
        <h2>El debate a cuatro de las elecciones generales del 29-N</h2>
        <p className="lead">
          Último debate de la campaña de las elecciones generales del 29 de noviembre de 2026: jueves 26 de noviembre a
          las 22:00 en TVE, el Canal 24 Horas y RTVE Play, con cinco bloques de unos 20 minutos.
        </p>

        <h2>Los candidatos del debate</h2>
        <ul>
          {DEBATE_OPTIONS.filter((o) => o.party).map((o) => {
            const party = partyLink(ids[o.id]);
            return (
              <li key={o.id}>
                <strong>{o.name}</strong>, candidato{o.id === "colau" ? "a" : ""} de{" "}
                {party ? <Link href={partyPath(party)}>{o.partyName}</Link> : o.partyName}
                {o.party !== o.partyName ? ` (${o.party})` : ""}.
              </li>
            );
          })}
        </ul>

        <h2>Temas del debate</h2>
        <ol>
          {DEBATE_TOPICS.map((t) => <li key={t}>{t}</li>)}
        </ol>

        <h2>Preguntas frecuentes</h2>
        {FAQ.map(([q, a]) => (
          <div key={q}>
            <h3>{q}</h3>
            <p>{a}</p>
          </div>
        ))}

        <p>
          <Link className="button" href="/encuesta-elecciones-generales-2026">Encuesta de las elecciones generales 2026 ↗</Link>{" "}
          <Link className="text-link" href="/partidos">Partidos y candidaturas →</Link>
        </p>
        <p className="lead" style={{ fontSize: 12 }}>
          Fotos de Wikimedia Commons: Pedro Sánchez, Pool Moncloa / Carlos Spottorno; Alberto Núñez Feijóo, Partido
          Popular (CC0); Santiago Abascal, Gage Skidmore (CC BY-SA 2.0); Ada Colau, Robo71 (CC0).
        </p>
      </section>
    </>
  );
}

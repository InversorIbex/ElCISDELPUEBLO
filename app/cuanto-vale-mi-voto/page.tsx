import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { VoteWeight } from "@/components/VoteWeight";
import {
  NATIONAL_AVERAGE_PER_SEAT, VOTE_WEIGHT_PATH, byWeight, formatInt, formatTimes, populationInfo, readableName, weightFor,
} from "@/lib/vote-weight";
import { breadcrumbLd, faqLd } from "@/lib/seo";

const ranked = byWeight();
const heaviest = ranked[0];
const lightest = ranked[ranked.length - 1];
const TITLE = "¿Cuánto vale tu voto? Habitantes por escaño en cada provincia (elecciones 2026)";
const DESCRIPTION = `Un voto en ${readableName(heaviest.name)} pesa ${formatTimes(heaviest.vsHeaviest)} veces lo que uno en ${readableName(lightest.name)}. Calcula cuánto vale tu voto en las elecciones generales del 29-N: habitantes por escaño en las 52 circunscripciones con datos del INE y el BOE.`;

type Props = { searchParams: Promise<{ provincia?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const w = weightFor((await searchParams).provincia ?? "");
  const title = w ? `¿Cuánto vale un voto en ${readableName(w.name)}? ${formatInt(w.perSeat)} habitantes por escaño` : TITLE;
  return {
    title,
    description: DESCRIPTION,
    keywords: [
      "cuánto vale mi voto", "valor del voto por provincia", "habitantes por escaño", "votos por escaño",
      "ley electoral", "D'Hondt", "voto Soria Madrid", "escaños por provincia 2026", "circunscripciones",
    ],
    alternates: { canonical: VOTE_WEIGHT_PATH },
    openGraph: { type: "website", url: VOTE_WEIGHT_PATH, title, description: DESCRIPTION },
    twitter: { card: "summary_large_image", title, description: DESCRIPTION },
  };
}

const FAQ = [
  ["¿Por qué un voto vale más en unas provincias que en otras?", "La ley electoral (LOREG, art. 162) da 2 diputados fijos a cada provincia y 1 a Ceuta y a Melilla. Los 248 restantes se reparten por población. Las provincias pequeñas tienen más diputados de los que les tocarían solo por habitantes."],
  [`¿Dónde vale más un voto?`, `En ${readableName(heaviest.name)}: ${formatInt(heaviest.perSeat)} habitantes por escaño, frente a ${formatInt(lightest.perSeat)} en ${readableName(lightest.name)}. La media de España es de ${formatInt(NATIONAL_AVERAGE_PER_SEAT)}.`],
  ["¿Por qué usáis la población y no el censo electoral?", "Porque es lo que usa la ley para repartir los escaños. El INE todavía no ha publicado el censo cerrado de las generales de 2026 por provincia. La población incluye a menores y a extranjeros sin derecho a voto, por eso la cifra es mayor que el número de electores."],
  ["¿También influye la ley D'Hondt?", "Sí. En las provincias con pocos escaños, los partidos pequeños necesitan un porcentaje muy alto para entrar. Puedes verlo en el simulador."],
] as const;

export default async function Page({ searchParams }: Props) {
  const { provincia } = await searchParams;
  return (
    <>
      <JsonLd nodes={[breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "¿Cuánto vale tu voto?", path: VOTE_WEIGHT_PATH }]), faqLd(FAQ)]} />
      <VoteWeight headingLevel={1} full initialProvince={weightFor(provincia ?? "") ? provincia : ""} />
      <section className="page-section">
        <div className="eyebrow">POR QUÉ PASA</div>
        <h2>El mismo voto, distinto peso</h2>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
        <p>
          Datos: <a href={populationInfo.source.url}>{populationInfo.source.name}</a>, población a 1/1/2025; escaños del RD 806/2026.
          Mira también <Link href="/mi-papeleta">qué se vota en tu municipio</Link> o haz tu <Link href="/porra-elecciones-2026">porra del Congreso</Link>.
        </p>
      </section>
    </>
  );
}

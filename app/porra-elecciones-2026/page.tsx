import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PorraHemiciclo } from "@/components/PorraHemiciclo";
import { MAJORITY, PORRA_PATH, decodePrediction, encodePrediction, summaryText } from "@/lib/porra";
import { breadcrumbLd, faqLd } from "@/lib/seo";

const TITLE = "Porra elecciones generales 2026: ¿cuántos escaños sacará cada partido el 29-N?";
const DESCRIPTION =
  "Haz tu porra de las elecciones generales del 29 de noviembre: reparte los 350 escaños del Congreso entre PP, PSOE, Vox, Frente Amplio, Podemos y el resto, compártela por WhatsApp o X con su imagen y mira en la clasificación quién se acerca más al recuento oficial.";

type Props = { searchParams: Promise<{ p?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = decodePrediction((await searchParams).p);
  const code = p ? encodePrediction(p) : null;
  const image = code ? `/api/porra-imagen?p=${code}` : "/api/porra-imagen";
  // og:url con la porra: WhatsApp y Facebook vuelven a leer esa dirección y, sin ?p, enseñarían la porra vacía.
  const shareUrl = code ? `${PORRA_PATH}?p=${code}` : PORRA_PATH;
  const title = p ? summaryText(p) : TITLE;
  return {
    title: p ? "Mi porra del 29-N" : TITLE,
    description: DESCRIPTION,
    keywords: [
      "porra elecciones", "porra elecciones generales 2026", "clasificación porra elecciones", "predicción elecciones 2026", "quién ganará las elecciones",
      "cuántos escaños", "escaños Congreso 2026", "hemiciclo", "mayoría absoluta 176", "pronóstico elecciones 29N",
    ],
    alternates: { canonical: PORRA_PATH },
    robots: p ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", url: shareUrl, title, description: "¿Y la tuya? Reparte los 350 escaños y compárala con el recuento del 29-N.", images: [{ url: image, width: 1200, height: 630, alt: "Hemiciclo del Congreso con una porra de escaños" }] },
    twitter: { card: "summary_large_image", title, description: "Haz tu porra del Congreso para el 29-N.", images: [image] },
  };
}

const FAQ = [
  ["¿Qué es la porra del hemiciclo?", "Un juego para predecir cuántos escaños sacará cada partido en las elecciones generales del 29 de noviembre de 2026. Repartes los 350 diputados del Congreso y compartes tu predicción."],
  ["¿Cuántos escaños hacen falta para gobernar?", `La mayoría absoluta del Congreso es de ${MAJORITY} escaños de 350. Con menos, un candidato necesita apoyos de otros grupos en la investidura.`],
  ["¿Cuándo se sabe quién acierta?", "A partir de las 21:00 (hora peninsular) del domingo 29-N, cuando cierran los colegios de Canarias y empieza a publicarse el escrutinio. Tu porra se compara con el recuento oficial en directo y se publica la clasificación."],
  ["¿Cómo entro en la clasificación?", "Apunta tu porra con un apodo antes de las 20:00 del 29-N. Puedes cambiarla hasta entonces. Gana quien saca más puntos; a igualdad, quien falla menos escaños, y si sigue el empate, quien la apuntó antes."],
  ["¿Es una encuesta?", "No. Es tu predicción personal. Solo guardamos las porras que alguien apunta para la clasificación, no se enseñan antes de las 21:00 del 29-N y nunca publicamos sumas ni medias, por eso no es un sondeo electoral."],
  ["¿De dónde sale el punto de partida?", "Del resultado oficial de las generales de 2023 (BOE), con PSC dentro de PSOE. Sumar no se presenta con marca propia el 29-N, así que sus 31 escaños de 2023 salen en Frente Amplio. Puedes vaciarlo y empezar de cero."],
] as const;

export default async function Page({ searchParams }: Props) {
  const { p } = await searchParams;
  return (
    <>
      <JsonLd nodes={[breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Porra elecciones 2026", path: PORRA_PATH }]), faqLd(FAQ)]} />
      <PorraHemiciclo headingLevel={1} initial={p ?? null} showPageLink={false} />
      <section className="page-section">
        <div className="eyebrow">CÓMO FUNCIONA LA PORRA</div>
        <h2>Tu predicción del Congreso para el 29-N</h2>
        <p className="lead">
          Reparte los 350 escaños, mira si alguien llega a la mayoría absoluta de {MAJORITY} comparte tu hemiciclo con su imagen y apúntalo en la clasificación.
          El domingo por la noche, con el <Link href="/noche-electoral">recuento en directo</Link>, verás cuántos puntos sacas y quién se ha acercado más.
        </p>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
        <p>
          ¿Quieres entender por qué los escaños no son proporcionales a los votos? Prueba el <Link href="/simulador">simulador D&apos;Hondt</Link> o
          mira <Link href="/cuanto-vale-mi-voto">cuánto vale tu voto</Link> en tu provincia.
        </p>
      </section>
    </>
  );
}

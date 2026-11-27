import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Papeleta } from "@/components/Papeleta";
import { BALLOT_PATH, VOTER_GUIDE } from "@/lib/ballot";
import { breadcrumbLd, faqLd } from "@/lib/seo";
import { weightFor } from "@/lib/vote-weight";

export const metadata: Metadata = {
  title: "Mi papeleta 29-N: qué partidos se presentan en mi provincia, dónde y cómo votar",
  description:
    "Escribe tu municipio y mira las candidaturas oficiales al Congreso de tu provincia, los escaños en juego y cómo se repartieron en 2023. Horario de los colegios, documentación para votar y dónde consultar tu mesa electoral.",
  keywords: [
    "dónde voto", "dónde votar 29N", "mi colegio electoral", "qué partidos se presentan en mi provincia",
    "candidaturas por provincia", "papeleta elecciones generales 2026", "horario colegios electorales",
    "qué documento necesito para votar", "jornada de reflexión", "me ha tocado mesa electoral",
  ],
  alternates: { canonical: BALLOT_PATH },
  openGraph: { type: "website", url: BALLOT_PATH, title: "Mira tu papeleta del 29-N", description: "Candidaturas oficiales de tu provincia y todo lo que necesitas para votar el domingo." },
};

const FAQ = [
  ...VOTER_GUIDE.map(([t, d]) => [
    t === "Cuándo" ? "¿A qué hora abren y cierran los colegios electorales?" :
    t === "Qué llevar" ? "¿Qué documento necesito para votar?" :
    t === "Dónde" ? "¿Dónde voto el 29 de noviembre?" :
    t === "Dos papeletas" ? "¿Cuántas papeletas hay que meter?" : "¿Qué hago si me ha tocado mesa?", d,
  ] as const),
  ["¿Qué es la jornada de reflexión?", "El sábado 28 de noviembre, víspera de la votación. Los partidos no pueden hacer campaña ni pedir el voto. La información neutral, como esta guía, sí está permitida."],
] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ provincia?: string }> }) {
  const { provincia } = await searchParams;
  return (
    <>
      <JsonLd nodes={[breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Mi papeleta", path: BALLOT_PATH }]), faqLd(FAQ)]} />
      <Papeleta headingLevel={1} showPageLink={false} initialProvince={weightFor(provincia ?? "") ? provincia : ""} />
      <section className="page-section">
        <div className="eyebrow">GUÍA PARA VOTAR EL DOMINGO</div>
        <h2>Todo lo que necesitas saber para votar el 29-N</h2>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
        <p>
          ¿Quieres saber quién ganará? Haz tu <Link href="/porra-elecciones-2026">porra del Congreso</Link> y sigue
          el <Link href="/noche-electoral">recuento en directo</Link> desde las 21:00.
        </p>
      </section>
    </>
  );
}

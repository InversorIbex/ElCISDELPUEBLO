import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { NocheElectoral } from "@/components/NocheElectoral";
import { NIGHT_PATH, NIGHT_SCHEDULE, RESULTS_SOURCE } from "@/lib/election-night";
import { MAJORITY } from "@/lib/porra";
import { abs, breadcrumbLd, faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Resultados elecciones generales 2026 en directo: recuento y escaños del 29-N",
  description:
    "Sigue en directo el recuento de las elecciones generales del 29 de noviembre de 2026: escaños de cada partido, porcentaje escrutado, participación a las 14:00 y a las 18:00 y si alguien llega a la mayoría absoluta.",
  keywords: [
    "resultados elecciones generales 2026", "resultados elecciones 29N", "recuento elecciones en directo",
    "escrutinio elecciones generales", "noche electoral", "quién ha ganado las elecciones", "participación elecciones 2026",
    "escaños PP PSOE Vox", "mayoría absoluta", "resultados en directo",
  ],
  alternates: { canonical: NIGHT_PATH },
  openGraph: { type: "website", url: NIGHT_PATH, title: "Recuento en directo de las elecciones generales del 29-N", description: "Escaños, participación y tu porra frente al resultado oficial." },
};

const FAQ = [
  ["¿A qué hora se conocen los resultados de las elecciones?", "Los colegios cierran a las 20:00 en la Península y a las 21:00 (hora peninsular) en Canarias. El escrutinio provisional se publica desde entonces y suele estar casi completo antes de la medianoche."],
  ["¿Cuándo se sabe la participación?", "El Ministerio del Interior da dos avances durante la jornada, a las 14:00 y a las 18:00, y la participación final con el escrutinio."],
  ["¿Cuántos escaños hacen falta para la mayoría absoluta?", `${MAJORITY} de los 350 diputados del Congreso.`],
  ["¿De dónde salen los datos?", `Del escrutinio provisional oficial del ${RESULTS_SOURCE.name}. No publicamos sondeos a pie de urna ni estimaciones propias.`],
] as const;

const eventLd = {
  "@type": "Event",
  "@id": abs(`${NIGHT_PATH}#noche`),
  name: "Noche electoral de las elecciones generales 2026: recuento en directo",
  startDate: NIGHT_SCHEDULE[3].at,
  endDate: "2026-11-30T01:00:00Z",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  location: { "@type": "VirtualLocation", url: abs(NIGHT_PATH) },
  superEvent: { "@id": abs("/#elecciones-2026") },
  inLanguage: "es-ES",
};

export default function Page() {
  return (
    <>
      <JsonLd nodes={[breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Noche electoral", path: NIGHT_PATH }]), faqLd(FAQ), eventLd]} />
      <NocheElectoral headingLevel={1} full />
      <section className="page-section">
        <div className="eyebrow">PREGUNTAS DE LA NOCHE ELECTORAL</div>
        <h2>Resultados de las elecciones generales del 29-N</h2>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
        <p>
          Antes de que empiece: haz tu <Link href="/porra-elecciones-2026">porra</Link>, mira <Link href="/mi-papeleta">tu papeleta</Link> y
          descubre <Link href="/cuanto-vale-mi-voto">cuánto vale tu voto</Link>.
        </p>
      </section>
    </>
  );
}

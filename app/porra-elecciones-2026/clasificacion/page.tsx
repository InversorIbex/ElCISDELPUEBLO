import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PorraTodos } from "@/components/PorraTodos";
import { PORRA_PATH, PORRA_RANKING_PATH } from "@/lib/porra";
import { breadcrumbLd } from "@/lib/seo";

const TITLE = "Clasificación de la porra de las elecciones 2026: la porra de cada participante";
const DESCRIPTION =
  "Todas las porras del Congreso apuntadas para el 29-N, cada una con su hemiciclo, y la clasificación de quién se acerca más al recuento oficial. Se publica a partir de las 21:00 del 29 de noviembre.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["clasificación porra elecciones", "porra elecciones generales 2026", "quién ha acertado la porra", "porras del Congreso", "resultados porra 29N"],
  alternates: { canonical: PORRA_RANKING_PATH },
  openGraph: { type: "website", url: PORRA_RANKING_PATH, title: "¿Quién ha acertado la porra del 29-N?", description: "La porra de cada participante y quién se acerca más al recuento.", images: [{ url: "/api/porra-imagen", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "¿Quién ha acertado la porra del 29-N?", images: ["/api/porra-imagen"] },
};

export default function Page() {
  return (
    <>
      <JsonLd nodes={[breadcrumbLd([
        { name: "Inicio", path: "/" },
        { name: "Porra elecciones 2026", path: PORRA_PATH },
        { name: "Clasificación", path: PORRA_RANKING_PATH },
      ])]} />
      <section className="page-section">
        <div className="eyebrow">LA PORRA DEL HEMICICLO · CLASIFICACIÓN</div>
        <h1>La porra de cada participante</h1>
        <p className="lead">
          Todas las porras apuntadas con su hemiciclo. Con el recuento oficial, ordenadas de quien más se acerca a quien menos.{" "}
          <Link href={PORRA_PATH}>Haz o cambia la tuya</Link>.
        </p>
        <PorraTodos />
        <p className="lead" style={{ fontSize: 12, marginTop: 24 }}>
          Predicciones personales, no un sondeo. No publicamos sumas ni medias de las porras.
        </p>
      </section>
    </>
  );
}

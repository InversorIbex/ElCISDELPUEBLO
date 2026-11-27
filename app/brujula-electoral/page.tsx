import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Brujula } from "@/components/Brujula";
import { BRUJULA_PATH, STATEMENTS } from "@/lib/brujula";
import { breadcrumbLd, faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Brújula electoral 2026: test político para saber dónde estás antes del 29-N",
  description:
    "Test político de 18 preguntas sobre economía, sociedad y modelo territorial. Descubre tu posición en el mapa político antes de las elecciones generales del 29 de noviembre. Sin registro y sin enviar tus respuestas.",
  keywords: [
    "brújula electoral", "test político", "test ideológico", "a quién votar", "a quién voto",
    "brújula política", "izquierda o derecha test", "test elecciones 2026", "orientación de voto",
  ],
  alternates: { canonical: BRUJULA_PATH },
  openGraph: { type: "website", url: BRUJULA_PATH, title: "¿Dónde estás en el mapa político? Brújula electoral 2026", description: "18 preguntas, 2 minutos. Tus respuestas no salen de tu móvil." },
};

const FAQ = [
  ["¿Cómo funciona la brújula electoral?", `Respondes ${STATEMENTS.length} afirmaciones de muy en desacuerdo a muy de acuerdo. Cada respuesta te mueve en uno de tres ejes: economía (más Estado o más mercado), sociedad (progresista o conservador) y territorio (más autogobierno o más Estado central).`],
  ["¿Me dice a quién votar?", "No. Te sitúa en el mapa político, pero no te compara con partidos: no hemos verificado sus programas punto por punto y asignarles posiciones a mano sería opinar por ellos."],
  ["¿Se guardan mis respuestas?", "No salen de tu navegador. No se envían al servidor ni se publican."],
  ["¿Por qué hay preguntas en los dos sentidos?", "En cada eje, la mitad de las afirmaciones empuja hacia un lado y la otra mitad hacia el contrario. Así, estar siempre de acuerdo no te lleva a un extremo."],
] as const;

export default function Page() {
  return (
    <>
      <JsonLd nodes={[breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Brújula electoral", path: BRUJULA_PATH }]), faqLd(FAQ)]} />
      <section className="page-section">
        <div className="eyebrow">BRÚJULA ELECTORAL · 18 PREGUNTAS · 2 MINUTOS</div>
        <h1>¿Dónde estás tú <em>en el mapa político?</em></h1>
        <p className="lead">Economía, sociedad y modelo territorial. Contesta con sinceridad: nadie más ve tus respuestas.</p>
        <Brujula />
      </section>
      <section className="page-section">
        <div className="eyebrow">SOBRE LA BRÚJULA</div>
        <h2>Un test político neutral</h2>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
        <p>
          Después, consulta las <Link href="/partidos">candidaturas de cada partido</Link> y mira <Link href="/mi-papeleta">qué se vota en tu provincia</Link>.
        </p>
      </section>
    </>
  );
}

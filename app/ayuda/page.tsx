import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, faqLd } from "@/lib/seo";
export const metadata = {
  title: "Preguntas frecuentes sobre las elecciones generales 2026 y el sondeo",
  description: "Cuándo son las elecciones generales 2026, cómo votar en el sondeo ciudadano, cómo se calculan los escaños con D'Hondt y por qué no hay resultados durante la veda electoral.",
  alternates: { canonical: "/ayuda" },
};
const questions = [
  ["¿Cuándo son las elecciones generales de 2026?", "El domingo 29 de noviembre de 2026. Se eligen los 350 diputados del Congreso en 52 circunscripciones y los senadores. Las convoca el Real Decreto 806/2026 (BOE de 6 de octubre de 2026)."],
  ["¿Puedo votar en el sondeo de El Pueblo Opina?", "Sí. Entra en «Participar», elige tu provincia, selecciona una de las candidaturas proclamadas en tu circunscripción, acepta el consentimiento y supera la verificación antirobots. Es un sondeo voluntario: no sustituye a tu voto en las elecciones."],
  ["¿Cuántas veces puedo votar?", "Una vez por navegador. Además, desde una misma conexión a Internet se admiten como máximo dos votos cada cinco horas, para que puedan votar varias personas de un mismo hogar sin facilitar votos masivos."],
  ["¿Dónde veo los resultados del sondeo?", "En la portada y en «Resultados»: el mapa colorea cada provincia con la candidatura más votada, al pulsarla ves los votos y el porcentaje de cada candidatura, y el hemiciclo muestra la proyección de escaños. Siempre se indica con cuántos votos está calculado."],
  ["¿Cómo se calcula la proyección de escaños?", "En cada circunscripción con votos se aplica la ley D'Hondt con la barrera del 3 %, como en las elecciones reales. En las que todavía no tienen votos, los escaños se reparten a partes iguales entre los partidos que ya tienen votos en el sondeo y se presentan allí. Es una proyección del sondeo, no una predicción."],
  ["¿Por qué no se ven resultados entre el 24 y el 29 de noviembre?", "La ley electoral (LOREG, art. 69.7) prohíbe difundir sondeos electorales los cinco días anteriores a la votación. Puedes seguir votando; los resultados vuelven a mostrarse tras el cierre de los colegios el 29 de noviembre."],
  ["¿Qué partidos se presentan?", "Todas las candidaturas proclamadas oficialmente en el BOE, provincia a provincia. Puedes consultarlas en «Partidos» y en «Candidaturas», con su denominación exacta en la papeleta."],
  ["¿Los resultados representan a toda España?", "No. Es un sondeo abierto de internautas con participación voluntaria: la muestra no es representativa y sus porcentajes no equivalen a una encuesta con selección aleatoria ni a una predicción electoral."],
  ["¿Guardáis mi IP o mis datos?", "No guardamos tu IP: solo una huella cifrada (HMAC) para aplicar el límite de votos, que se borra al pasar la ventana de cinco horas. El voto se guarda separado, con la provincia, la candidatura y el día. No usamos geolocalización ni analítica de terceros."],
  ["¿Es el CIS oficial?", "No. El Pueblo Opina es un proyecto independiente, sin vinculación con el Centro de Investigaciones Sociológicas, el Gobierno ni los organismos electorales."],
] as const;
export default function Help() {
  return (
    <section className="page-section">
      <JsonLd nodes={[faqLd(questions), breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Preguntas frecuentes", path: "/ayuda" }])]} />
      <div className="eyebrow">PREGUNTAS FRECUENTES</div>
      <h1>Elecciones generales 2026 y el sondeo: preguntas frecuentes</h1>
      <p className="lead">
        Lo que necesitas saber para votar en el sondeo y entender sus resultados.
      </p>
      <div className="faq-list">
        {questions.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <div className="actions">
        <Link className="button" href="/candidaturas">
          Ver candidaturas ↗
        </Link>
        <Link className="secondary" href="/contacto">
          Comunicar una incidencia →
        </Link>
      </div>
    </section>
  );
}

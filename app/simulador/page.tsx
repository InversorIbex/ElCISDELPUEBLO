import { SeatSimulator } from "@/components/SeatSimulator";
import election from "@/data/elections/congress-2026.json";
export const metadata = {
  title: "Simulación experimental de escaños · Escenario manual",
};
export default function Page() {
  return (
    <section className="page-section simulator-page">
      <div className="eyebrow">EL SISTEMA ELECTORAL, PASO A PASO</div>
      <h1>
        Un escenario.
        <br />
        Sus reglas. Sus escaños.
      </h1>
      <p className="lead">
        Simulación experimental de escaños del Congreso. Explora la matemática
        de una circunscripción con cifras que tú introduces.
      </p>
      <div className="notice simulator-notice">
        <span aria-hidden="true">ⓘ</span>
        <p>
          <strong>NO ES UNA PREDICCIÓN ELECTORAL</strong>
          <br />
          Los escenarios son hipotéticos. No proceden de resultados del sondeo
          ni representan a la población.
        </p>
      </div>
      <SeatSimulator constituencies={election.constituencies} />
      <div className="prose">
        <h2>52 circunscripciones, no un reparto nacional único</h2>
        <p>
          El anexo de la convocatoria fija 350 diputados distribuidos entre las
          provincias y las ciudades autónomas. Este módulo calcula una
          circunscripción cada vez. No aplica D’Hondt al conjunto de España como
          si fuera una sola.
        </p>
        <h2>De dónde salen las reglas</h2>
        <p>
          Escaños por circunscripción:{" "}
          <a href={election.source.url}>Real Decreto 806/2026, anexo</a>.
          Atribución y desempates:{" "}
          <a href={election.legalRulesSource}>LOREG, artículo 163</a>. Los
          cocientes se comparan con aritmética exacta; su presentación puede
          estar redondeada.
        </p>
        <h2>Modo B · Basado en respuestas del sondeo</h2>
        <p>
          No hay datos suficientes para realizar una simulación territorial
          responsable. Este modo permanece cerrado. No se completan provincias
          inventando cifras.
        </p>
      </div>
    </section>
  );
}

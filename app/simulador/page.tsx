import { ParliamentLab } from "@/components/ParliamentLab";
import previous from "@/data/elections/congress-2023-results.json";
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
      <ParliamentLab
        constituencies={election.constituencies}
        previousGroups={previous.parties.map((p, i) => ({
          ...p,
          color: [
            "#1673b7",
            "#bc3b3b",
            "#6a993f",
            "#ba729e",
            "#e86464",
            "#c0a337",
            "#598b9d",
            "#498b6b",
            "#618a5b",
            "#66a5b2",
            "#78839a",
            "#9d7d4c",
          ][i],
        }))}
      />
      <div className="prose">
        <h2>Fuentes de la comparación</h2>
        <p>
          Resultados oficiales de 2023:{" "}
          <a href={previous.source.url}>
            Resolución de la Junta Electoral Central publicada en el BOE
          </a>
          . PSOE y PSC se conservan separados como en sus tablas. Es la
          composición derivada de esas elecciones, no los grupos parlamentarios
          al final de la legislatura.
        </p>
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

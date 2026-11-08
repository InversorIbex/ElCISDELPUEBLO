import Link from "next/link";
export const metadata = { title: "Preguntas frecuentes" };
const questions = [
  [
    "¿Ya puedo votar?",
    "Todavía no. Puedes consultar las candidaturas, sus fuentes y el simulador. La apertura se anunciará aquí cuando estén completadas las garantías de privacidad y seguridad. No pedimos opiniones para acceder a estas herramientas.",
  ],
  [
    "¿Cómo se situará mi respuesta?",
    "Elegirás manualmente una de las 52 circunscripciones del Congreso. No usaremos GPS ni geolocalización por IP. No será necesario guardar tu municipio ni acreditar dónde resides; la circunscripción será declarada por ti.",
  ],
  [
    "¿Qué significa identificar el dispositivo?",
    "El diseño utiliza una credencial aleatoria específica del sondeo en tu navegador, no un identificador físico ni una huella del dispositivo. Cambiar de navegador o borrar sus datos puede impedir reconocerla. Por eso no podemos garantizar una respuesta por persona o dispositivo.",
  ],
  [
    "¿Podré cambiar o retirar mi respuesta?",
    "Sí, el diseño permite sustituirla o retirarla mediante su credencial. Cambiarla resta el cómputo anterior y suma el nuevo: no cuenta como una participación adicional. El mecanismo está probado en laboratorio y aún no está habilitado para respuestas reales.",
  ],
  [
    "¿Estos resultados representarán a toda España?",
    "No. Un sondeo abierto de internautas tiene participación voluntaria y muestra no representativa. Sus porcentajes no equivalen a una encuesta con selección aleatoria ni a una predicción electoral.",
  ],
  [
    "¿El simulador guarda lo que introduzco?",
    "El cálculo se realiza en esta página. Los escenarios y sus puntos de evolución solo se mantienen en memoria y se pierden al recargar. No se envían como respuesta al sondeo. Las alternativas A/B son hipótesis manuales, no partidos asignados automáticamente.",
  ],
  [
    "¿Qué compara el hemiciclo?",
    "Tu escenario provincial manual y el resultado electoral oficial de 2023 publicado por la Junta Electoral Central. Las provincias no modelizadas quedan sin asignar. La referencia de 2023 no es la composición de los grupos parlamentarios al final de la legislatura.",
  ],
  [
    "¿Por qué faltan algunos logos?",
    "Todas las candidaturas proclamadas figuran aunque no tengan imagen. Solo se muestran logos con fuente verificada; no se recrean marcas ni se asigna a una coalición el logo de uno de sus componentes sin revisión. La cobertura actual es parcial.",
  ],
  [
    "¿Es el CIS oficial?",
    "No. El CIS del Pueblo es un proyecto independiente, sin vinculación con el Centro de Investigaciones Sociológicas, el Gobierno ni los organismos electorales.",
  ],
];
export default function Help() {
  return (
    <section className="page-section">
      <div className="eyebrow">PREGUNTAS FRECUENTES</div>
      <h1>Antes de sacar conclusiones.</h1>
      <p className="lead">
        Qué funciona hoy y cómo se prepara la participación.
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

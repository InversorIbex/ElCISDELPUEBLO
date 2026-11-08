import { EmptyState } from "@/components/EmptyState";
export const metadata = { title: "Preguntas del pueblo" };
export default function Page() {
  return (
    <section className="page-section">
      <div className="eyebrow">PREGUNTAS DEL PUEBLO</div>
      <h1>Los asuntos que compartimos.</h1>
      <p className="lead">
        Preguntas neutrales sobre vivienda, sanidad, empleo y otros temas de
        interés general.
      </p>
      <EmptyState
        title="No hay preguntas abiertas"
        text="Estamos preparando las primeras consultas. Cada pregunta tendrá calendario, opciones revisadas y resultados agregados. Sus credenciales serán independientes del sondeo electoral."
      />
      <div className="prose">
        <h2>Sin construir perfiles de opinión</h2>
        <p>
          No se enlazarán respuestas entre preguntas ni con el sondeo electoral.
          El MVP no tendrá comentarios públicos ni respuestas libres sensibles.
        </p>
      </div>
    </section>
  );
}

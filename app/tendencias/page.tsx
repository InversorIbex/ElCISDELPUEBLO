import { EmptyState } from "@/components/EmptyState";
export const metadata = { title: "Tendencias" };
export default function Page() {
  return (
    <section className="page-section">
      <div className="eyebrow">EL TIEMPO APORTA PERSPECTIVA</div>
      <h1>Cambios, con sus límites.</h1>
      <p className="lead">
        Las series históricas estarán disponibles cuando existan publicaciones
        seguras y comparables.
      </p>
      <p>
        <a href="/simulador">
          Explorar hemiciclos y evolución de escenarios manuales →
        </a>
      </p>
      <EmptyState
        title="Todavía no hay una serie temporal"
        text="No se dibujan curvas ni variaciones ficticias. Las futuras publicaciones distinguirán respuestas activas acumuladas de respuestas recibidas en un intervalo, con periodos y denominadores explícitos."
      />
    </section>
  );
}

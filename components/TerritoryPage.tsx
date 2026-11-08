import { candidaciesForProvince } from "@/lib/candidacies/registry";
import Link from "next/link";
import { EmptyState } from "./EmptyState";
import { displayName } from "@/lib/territory-format";
export function TerritoryPage({
  name,
  kind,
  code,
  breadcrumbs,
  children,
  municipalityCount,
  candidacyProvinceCode,
}: {
  name: string;
  kind: string;
  code?: string;
  breadcrumbs: { name: string; href: string }[];
  children?: React.ReactNode;
  municipalityCount?: number;
  candidacyProvinceCode?: string;
}) {
  return (
    <section className="page-section territory-page">
      <nav className="breadcrumbs" aria-label="Ruta territorial">
        <Link href="/espana">España</Link>
        {breadcrumbs.map((b) => (
          <span key={b.href}>
            {" "}
            / <Link href={b.href}>{displayName(b.name)}</Link>
          </span>
        ))}
      </nav>
      <div className="territory-title">
        <div>
          <div className="eyebrow">
            {kind}
            {code ? ` · CÓDIGO INE ${code}` : ""}
          </div>
          <h1>{displayName(name)}</h1>
          <p className="lead">
            Una mirada al territorio. Resultados solo cuando sea seguro
            publicarlos.
          </p>
        </div>
        <span className="territory-seal" aria-hidden="true">
          {code ?? "ES"}
        </span>
      </div>
      <div className="territory-metrics">
        <div>
          <span>Participaciones válidas</span>
          <strong>Sin publicación</strong>
        </div>
        <div>
          <span>
            {municipalityCount === undefined
              ? "Tipo de ubicación"
              : "Municipios en el catálogo"}
          </span>
          <strong>
            {municipalityCount === undefined
              ? "Declarada"
              : municipalityCount.toLocaleString("es-ES", {
                  useGrouping: "always",
                })}
          </strong>
        </div>
        <div>
          <span>Fuente territorial</span>
          <strong>INE · 01/01/2026</strong>
        </div>
      </div>
      <EmptyState
        title="Todavía no hay respuestas publicadas"
        text="El catálogo identifica el territorio; no contiene opiniones políticas. La recogida permanece cerrada. Los futuros resultados respetarán el umbral de privacidad y las reglas contra reconstrucción por diferencias."
      />
      {candidacyProvinceCode && (
        <div className="territory-candidacies">
          <div>
            <div className="eyebrow">TU CIRCUNSCRIPCIÓN DEL CONGRESO</div>
            <h2>
              {candidaciesForProvince(candidacyProvinceCode).length}{" "}
              candidaturas proclamadas
            </h2>
            <p>
              Consulta las listas de tu provincia, con sus denominaciones
              oficiales y fuentes.
            </p>
          </div>
          <Link
            className="button"
            href={`/candidaturas?provincia=${candidacyProvinceCode}`}
          >
            Ver candidaturas ↗
          </Link>
        </div>
      )}
      {children}
      <div className="territory-explainer">
        <div>
          <span>01</span>
          <h3>Elige tú el territorio</h3>
          <p>Sin GPS, sin ubicación por IP y sin residencia inferida.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Lee con contexto</h3>
          <p>Sondeo abierto de internautas. Muestra no representativa.</p>
        </div>
        <div>
          <span>03</span>
          <h3>La privacidad va primero</h3>
          <p>Sin muestras pequeñas ni comparaciones que revelen respuestas.</p>
        </div>
      </div>
    </section>
  );
}

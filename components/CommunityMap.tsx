"use client";
import { useRef, useState } from "react";
type Feature = {
  code: string;
  name: string;
  href: string;
  path: string;
  inset: boolean;
};
export function CommunityMap({ features }: { features: Feature[] }) {
  const [zoom, setZoom] = useState(1),
    [active, setActive] = useState<string | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  return (
    <section className="community-map" aria-labelledby="community-map-title">
      <div className="map-heading">
        <div>
          <span className="eyebrow">
            CARTOGRAFÍA OFICIAL / VISTA AUTONÓMICA
          </span>
          <h2 id="community-map-title">Un país, muchos lugares.</h2>
        </div>
        <div className="map-zoom" aria-label="Controles del mapa">
          <button
            type="button"
            aria-label="Alejar mapa"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          >
            −
          </button>
          <span>{Math.round(zoom * 100)} %</span>
          <button
            type="button"
            aria-label="Acercar mapa"
            disabled={zoom >= 2}
            onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Restablecer vista nacional"
            onClick={() => {
              setZoom(1);
              scroll.current?.scrollTo({ top: 0, left: 0 });
            }}
          >
            ↺
          </button>
        </div>
      </div>
      <div
        className="map-canvas"
        ref={scroll}
        tabIndex={0}
        aria-label="Mapa de comunidades. Puedes ampliar y desplazar la vista. También hay un directorio de texto debajo."
      >
        <svg
          viewBox="0 0 760 680"
          style={{ width: `${zoom * 100}%` }}
          role="img"
          aria-labelledby="map-svg-title map-svg-desc"
        >
          <title id="map-svg-title">
            Comunidades y ciudades autónomas de España
          </title>
          <desc id="map-svg-desc">
            Límites administrativos derivados del IGN. Cada territorio enlaza a
            su ficha. Canarias, Ceuta y Melilla aparecen en recuadros con escala
            propia. No se muestran resultados de opinión.
          </desc>
          <defs>
            <pattern
              id="cartography-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M40 0H0V40"
                fill="none"
                stroke="#dce5d9"
                strokeWidth="0.55"
              />
            </pattern>
          </defs>
          <rect width="760" height="680" fill="url(#cartography-grid)" />
          <g className="map-insets" aria-hidden="true">
            <rect x="15" y="515" width="265" height="150" />
            <rect x="305" y="515" width="160" height="150" />
            <rect x="480" y="515" width="160" height="150" />
            <text x="30" y="536">
              CANARIAS
            </text>
            <text x="320" y="536">
              CEUTA
            </text>
            <text x="495" y="536">
              MELILLA
            </text>
            <text x="655" y="580" className="map-scale-note">
              <tspan x="655">Recuadros</tspan>
              <tspan x="655" dy="14">
                con escala
              </tspan>
              <tspan x="655" dy="14">
                propia
              </tspan>
            </text>
          </g>
          <g>
            {features.map((f) => (
              <a
                key={f.code}
                href={f.href}
                aria-label={`Abrir ${f.name}. Sin resultados publicados.`}
                onMouseEnter={() => setActive(f.name)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(f.name)}
                onBlur={() => setActive(null)}
              >
                <path
                  className="community-shape"
                  d={f.path}
                  fillRule="evenodd"
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{f.name} · Sin resultados publicados</title>
                </path>
              </a>
            ))}
          </g>
        </svg>
      </div>
      <div className="map-legend">
        <span className="map-key" aria-hidden="true" />
        <span>Límites territoriales · Sin resultados de sondeo</span>
        <strong aria-live="polite">
          {active ?? "Selecciona un territorio para abrir su ficha ↗"}
        </strong>
      </div>
      <div className="map-attribution">
        <span>
          Obra derivada de unidades administrativas ·{" "}
          <a href="https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf">
            CC BY 4.0 ign.es
          </a>
        </span>
        <span>
          Geometría simplificada para orientación nacional. Recuadros con escala
          propia.
        </span>
      </div>
    </section>
  );
}

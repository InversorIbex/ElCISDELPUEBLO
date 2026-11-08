import { CommunityMap } from "@/components/CommunityMap";
import mapData from "@/data/cartography/communities-svg.json";
import Link from "next/link";
import { TerritorySelector } from "@/components/TerritorySelector";
import {
  communities,
  provinces,
  municipalities,
  communityPath,
  displayName,
} from "@/lib/territories";
export const metadata = {
  title: "Explorador territorial · Municipios de España",
};
export default function Page() {
  return (
    <section className="page-section explorer">
      <div className="eyebrow">EL TERRITORIO IMPORTA</div>
      <h1>
        España empieza
        <br />
        en tu municipio.
      </h1>
      <p className="lead">
        Un país, miles de lugares. Encuentra el tuyo en el catálogo oficial y
        abre su ficha.
      </p>
      <div className="catalog-ribbon">
        <span>
          <strong>
            {municipalities.length.toLocaleString("es-ES", {
              useGrouping: "always",
            })}
          </strong>{" "}
          municipios
        </span>
        <span>
          <strong>52</strong> códigos provinciales
        </span>
        <span>
          <strong>19</strong> comunidades y ciudades autónomas
        </span>
        <span>Fuente: INE · 1 de enero de 2026</span>
      </div>
      <CommunityMap features={mapData.features} />
      <TerritorySelector communities={communities} provinces={provinces} />
      <div className="directory-heading">
        <div>
          <div className="eyebrow">UNA MIRADA A TODO EL PAÍS</div>
          <h2>Explora por comunidad.</h2>
        </div>
        <Link className="text-link" href="/espana">
          Directorio de España ↗
        </Link>
      </div>
      <div className="community-grid">
        {communities.map((c) => (
          <Link key={c.code} href={communityPath(c)}>
            <span className="community-code">{c.code}</span>
            <h3>{displayName(c.name)}</h3>
            <span className="community-count">
              {municipalities
                .filter((m) => m.communityCode === c.code)
                .length.toLocaleString("es-ES", { useGrouping: "always" })}{" "}
              municipios
            </span>
            <span className="community-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
      <div className="cartography-status">
        <div className="eyebrow">SIGUIENTE NIVEL / PROVINCIAS Y MUNICIPIOS</div>
        <h2>Del mapa nacional al detalle local.</h2>
        <p>
          La vista autonómica ya utiliza geometrías oficiales del IGN, con
          Baleares y recuadros para Canarias, Ceuta y Melilla. Las capas
          provinciales y municipales optimizadas siguen pendientes. El
          directorio textual permite consultar todos los municipios. No hay
          resultados de sondeo publicados.
        </p>
      </div>
    </section>
  );
}

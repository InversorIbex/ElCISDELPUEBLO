import Link from "next/link";
import { CommunityMap } from "@/components/CommunityMap";
import { CandidacyList } from "@/components/CandidacyList";
import mapData from "@/data/cartography/communities-svg.json";
import {
  communityByCode,
  provinces,
  provinceByCode,
  displayName,
} from "@/lib/territories";
import { candidaciesForProvince } from "@/lib/candidacies/registry";
export const metadata = { title: "Elige tu zona · Mapa del sondeo" };
export default async function Participate({
  searchParams,
}: {
  searchParams: Promise<{ comunidad?: string; provincia?: string }>;
}) {
  const query = await searchParams;
  const province =
    typeof query.provincia === "string"
      ? provinceByCode.get(query.provincia)
      : undefined;
  const community = province
    ? communityByCode.get(province.communityCode)
    : typeof query.comunidad === "string"
      ? communityByCode.get(query.comunidad)
      : undefined;
  const available = provinces
    .filter((p) => !community || p.communityCode === community.code)
    .sort((a, b) =>
      displayName(a.name).localeCompare(displayName(b.name), "es"),
    );
  const features = mapData.features.map((f) => ({
    ...f,
    href: `/participar?comunidad=${f.code}#circunscripcion`,
  }));
  return (
    <section className="page-section">
      <div className="eyebrow">TU CIRCUNSCRIPCIÓN, TUS OPCIONES</div>
      <h1>Empieza por tu zona.</h1>
      <p className="lead">
        Elige la comunidad en el mapa y después tu provincia o ciudad autónoma.
        No usamos geolocalización ni necesitas indicar municipio.
      </p>
      <div className="ballot-consultation-note">
        <span className="pill">VOTACIÓN TODAVÍA NO ABIERTA</span>
        <p>
          Puedes explorar las candidaturas y sus logos disponibles. Los votos
          reales y sus resultados necesitan un servicio de participación de
          producción aún no conectado.{" "}
          <Link href="/privacidad">Estado de las garantías →</Link>
        </p>
      </div>
      <CommunityMap features={features} selectionMode />
      <section id="circunscripcion" className="constituency-selection">
        <div className="eyebrow">PASO 2 / CIRCUNSCRIPCIÓN</div>
        <h2>
          {community
            ? displayName(community.name)
            : "Elige directamente tu circunscripción."}
        </h2>
        <p>También puedes usar esta lista sin interactuar con el mapa.</p>
        {community && (
          <Link className="text-link" href="/participar#circunscripcion">
            Ver todas las circunscripciones →
          </Link>
        )}
        <form
          className="constituency-form"
          action="/participar#papeleta"
          method="get"
        >
          <div>
            <label htmlFor="participation-province">
              Provincia o ciudad autónoma
            </label>
            <select
              id="participation-province"
              name="provincia"
              defaultValue={province?.code ?? ""}
              required
            >
              <option value="" disabled>
                Selecciona tu circunscripción
              </option>
              {available.map((p) => (
                <option key={p.code} value={p.code}>
                  {displayName(p.name)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button">
            Ver candidaturas y logos →
          </button>
        </form>
        <div className="district-shortcuts">
          {available.map((p) => (
            <Link
              key={p.code}
              href={`/participar?provincia=${p.code}#papeleta`}
            >
              {displayName(p.name)} ↗
            </Link>
          ))}
        </div>
        {((query.provincia && !province) ||
          (query.comunidad && !community)) && (
          <p className="form-error" role="alert">
            El territorio solicitado no es válido. Selecciona una opción de la
            lista.
          </p>
        )}
      </section>
      {province && (
        <section id="papeleta">
          <div className="directory-heading">
            <div>
              <div className="eyebrow">PASO 3 / CANDIDATURAS DEL CONGRESO</div>
              <h2>{displayName(province.name)}</h2>
              <p>
                {candidaciesForProvince(province.code).length} candidaturas
                proclamadas · consulta sin registrar preferencias
              </p>
            </div>
            <Link
              className="button"
              href={`/resultados?provincia=${province.code}`}
            >
              Ver resultados de esta zona ↗
            </Link>
          </div>
          <CandidacyList list={candidaciesForProvince(province.code)} />
          <div className="notice">
            <p>
              Faltan logos verificados para algunas candidaturas; todas aparecen
              igualmente. La selección de una formación y el envío de votos se
              habilitarán cuando funcione el servicio real. No se registra una
              respuesta al abrir estas tarjetas.
            </p>
          </div>
        </section>
      )}
      <p className="denominator-note">
        El mapa representa comunidades, no límites provinciales. La lista
        posterior identifica las 52 circunscripciones del Congreso, incluidas
        Ceuta y Melilla.
      </p>
    </section>
  );
}

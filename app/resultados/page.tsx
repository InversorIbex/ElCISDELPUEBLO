import { LiveResultsSection } from "@/components/LiveResults";
import Link from "next/link";
import previous from "@/data/elections/congress-2023-results.json";
import { provinces, provinceByCode, displayName } from "@/lib/territories";
export const metadata = { title: "Resultados en vivo por circunscripción", robots: { index: false, follow: true } };
export default async function Results({
  searchParams,
}: {
  searchParams: Promise<{ provincia?: string }>;
}) {
  const query = await searchParams;
  const province =
    typeof query.provincia === "string"
      ? provinceByCode.get(query.provincia)
      : undefined;
  const district = province
    ? previous.constituencies.find((c) => c.provinceCode === province.code)
    : undefined;
  const parties = previous.parties
    .map((p) => ({
      ...p,
      seats: district
        ? ((district.seats as Record<string, number>)[p.id] ?? 0)
        : p.seats,
    }))
    .filter((p) => p.seats > 0)
    .sort((a, b) => b.seats - a.seats);
  const total = district?.totalSeats ?? 350;
  return (
    <section className="page-section">
      <div className="eyebrow">RESULTADOS / FUENTES Y CONTEXTO</div>
      <h1>{province ? displayName(province.name) : "España"}</h1>
      <p className="lead">
        El sondeo ciudadano y los resultados electorales oficiales se muestran
        por separado.
      </p>
      <form className="constituency-form" action="/resultados" method="get">
        <div>
          <label htmlFor="results-province">Ámbito</label>
          <select
            id="results-province"
            name="provincia"
            defaultValue={province?.code ?? ""}
          >
            <option value="">España</option>
            {[...provinces]
              .sort((a, b) =>
                displayName(a.name).localeCompare(displayName(b.name), "es"),
              )
              .map((p) => (
                <option key={p.code} value={p.code}>
                  {displayName(p.name)}
                </option>
              ))}
          </select>
        </div>
        <button type="submit" className="button">
          Consultar resultados →
        </button>
      </form>
      <LiveResultsSection provinces={provinces.map(p=>({code:p.code,name:displayName(p.name)}))} initialProvince={province?.code ?? "28"} />
      {query.provincia && !province && (
        <p role="alert" className="form-error">
          Código de circunscripción no válido. Se muestra España; selecciona un
          ámbito válido.
        </p>
      )}
      <section className="historical-district">
        <span className="pill">
          REFERENCIA HISTÓRICA · RESULTADO OFICIAL 2023
        </span>
        <h2>Los escaños de las elecciones anteriores.</h2>
        <p>
          {total} diputados en{" "}
          {province ? displayName(province.name) : "España"}. Estos son
          resultados electorales oficiales, no votos de esta web ni estimaciones
          actuales.
        </p>
        <div className="table-scroll">
          <table>
            <caption>
              Congreso · 23 de julio de 2023 ·{" "}
              {province ? displayName(province.name) : "España"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Candidatura</th>
                <th scope="col">Escaños oficiales</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((p) => (
                <tr key={p.id}>
                  <th scope="row">{p.name}</th>
                  <td>
                    <strong>{p.seats}</strong>
                    <div className="historical-seat-track" aria-hidden="true">
                      <span style={{ width: `${(p.seats / total) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td>{total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="denominator-note">
          Fuente: <a href={previous.source.url}>Junta Electoral Central, BOE</a>
          . PSOE y PSC separados como en la publicación. Se conserva el reparto
          de 2023, que puede diferir del de 2026; no representa los grupos
          parlamentarios al final de la legislatura.
        </p>
      </section>
      <div className="actions">
        <Link className="button" href="/simulador">
          Comparar escenarios en el hemiciclo ↗
        </Link>
        <Link className="secondary" href="/tendencias">
          Estado de las tendencias →
        </Link>
      </div>
    </section>
  );
}

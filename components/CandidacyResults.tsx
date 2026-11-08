import { logoForCandidacy } from "@/lib/candidacies/logos";
import type { Candidacy } from "@/lib/candidacies/registry";
import type { ProvincialRelease } from "@/lib/published-provincial";
import { percent } from "@/lib/published-provincial";
import styles from "./CandidacyResults.module.css";

export function CandidacyResults({
  list, provinceName, release,
}: { list: readonly Candidacy[]; provinceName: string; release: ProvincialRelease | null }) {
  const nf = new Intl.NumberFormat("es-ES");
  const pf = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return <section className={styles.wrapper} aria-labelledby="results-candidacies">
    <div className={styles.head}>
      <div>
        <span className={styles.eyebrow}>EL PUEBLO OPINA · SONDEO VOLUNTARIO</span>
        <h2 id="results-candidacies">Participación en {provinceName}</h2>
        <p>Los porcentajes corresponden a las respuestas válidas a candidaturas en esta circunscripción, no al censo ni a una predicción electoral.</p>
      </div>
      <span className={styles.label}>{release ? "Publicación revisada" : "Sin resultados publicados"}</span>
    </div>
    {release ? <p className={styles.meta}>Respuestas totales: {nf.format(release.totalResponses)} · Respuestas a candidaturas: {nf.format(release.candidacyResponses)} · Actualización: {new Date(release.publishedAt).toLocaleDateString("es-ES", { timeZone:"UTC" })}</p>
    : <p className={styles.empty}>Todavía no existen datos provinciales autorizados para publicar. Las candidaturas aparecen sin cifras, nunca como 0 %.</p>}
    <div className={styles.rows}>
      {list.map(c => {
        const logo = logoForCandidacy(c.officialName);
        const count = release?.counts[c.id];
        const share = count === undefined || !release ? null : percent(count,release.candidacyResponses);
        return <div className={styles.row} key={c.id}>
          <div className={styles.icon}>
            {logo ? <img src={logo.path} alt={`Identidad gráfica: ${c.officialName}`} width="56" height="42" loading="lazy" />
            : <span aria-label="Logotipo oficial pendiente de verificación" title="Logotipo oficial pendiente de verificación">—</span>}
          </div>
          <div className={styles.data}>
            <strong>{c.officialName}</strong>
            <div className={styles.track} role="img" aria-label={share === null ? "Sin porcentajes publicados" : `${pf.format(share)} por ciento`}>
              <div className={styles.fill} style={{width: `${share ?? 0}%`}} />
            </div>
          </div>
          <div className={styles.number}>
            <strong>{share === null ? "—" : `${pf.format(share)} %`}</strong>
            <small>{count === undefined ? "Sin datos" : `${nf.format(count)} respuestas`}</small>
          </div>
        </div>;
      })}
    </div>
    <p className={styles.foot}>Orden oficial de proclamación, no clasificación ni recomendación. Ningún dato individual se publica. Muestra autoseleccionada y no representativa.</p>
  </section>;
}

import type { ProvincialRelease } from "@/lib/published-provincial";
import type { Candidacy } from "@/lib/candidacies/registry";
import styles from "./ParticipationAnalysis.module.css";

export function ParticipationAnalysis({ release, list, provinceName }: {
  release: ProvincialRelease | null; list: readonly Candidacy[]; provinceName: string;
}) {
  if (!release || release.candidacyResponses < 1) return <section className={styles.shell} aria-labelledby="analysis-title">
    <span className={styles.eyebrow}>ANÁLISIS CIUDADANO · SIN PREDICCIONES</span>
    <h2 id="analysis-title">Así analizaremos la participación en {provinceName}</h2>
    <div className={styles.tiles}>
      <div><strong>Respuestas recibidas</strong><p>Se mostrará el total agregado cuando sea publicable.</p></div>
      <div><strong>Distribución entre candidaturas</strong><p>Porcentajes sobre respuestas a candidaturas, sin extrapolación al censo.</p></div>
      <div><strong>Transparencia del sondeo</strong><p>Fecha, tamaño de muestra, metodología y límites visibles.</p></div>
    </div>
    <p className={styles.note}>No hay publicaciones autorizadas. No se muestra una clasificación ni se inventan porcentajes.</p>
  </section>;
  const byId = new Map(list.map(c => [c.id,c.officialName]));
  const rows = Object.entries(release.counts).map(([id,count])=>({id,count,name:byId.get(id)??id}))
    .sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,"es"));
  const leader = rows[0];
  const nonCandidate = release.totalResponses - release.candidacyResponses;
  const pf = new Intl.NumberFormat("es-ES",{maximumFractionDigits:1,minimumFractionDigits:1});
  const nf = new Intl.NumberFormat("es-ES");
  return <section className={styles.shell} aria-labelledby="analysis-title">
    <span className={styles.eyebrow}>ANÁLISIS DESCRIPTIVO DEL SONDEO · NO REPRESENTATIVO</span>
    <h2 id="analysis-title">Radiografía de {provinceName}</h2>
    <div className={styles.tiles}>
      <div><strong>Respuestas totales</strong><b>{nf.format(release.totalResponses)}</b><p>Participaciones contabilizadas en la publicación aprobada.</p></div>
      <div><strong>Respuestas a candidaturas</strong><b>{nf.format(release.candidacyResponses)}</b><p>Denominador empleado para calcular las cuotas de las listas.</p></div>
      <div><strong>Otras respuestas</strong><b>{nf.format(nonCandidate)}</b><p>Sin desglose cuando pueda comprometer la privacidad.</p></div>
    </div>
    <h3>Candidaturas según esta muestra voluntaria</h3>
    <div className={styles.ranking}>{rows.slice(0,10).map((r,i)=><div key={r.id} className={styles.item}>
      <span>{i+1}. {r.name}</span><strong>{pf.format(100*r.count/release.candidacyResponses)} %</strong>
    </div>)}</div>
    {leader && <p className={styles.note}>La candidatura con más respuestas en este conjunto es {leader.name}. Este dato describe exclusivamente las respuestas recibidas y no permite inferir qué votará la población.</p>}
    <p className={styles.note}>Fecha de publicación: {release.publishedAt.slice(0,10)} · Referencia de revisión: {release.reviewReference}. No se proporcionan cruces demográficos, identificadores ni actualizaciones que permitan reconstruir respuestas individuales.</p>
  </section>;
}

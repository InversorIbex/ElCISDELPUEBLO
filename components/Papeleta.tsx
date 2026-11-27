"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BALLOT_PATH, VOTER_GUIDE, seats2023ForProvince } from "@/lib/ballot";
import { CENSUS_LOOKUP } from "@/lib/election-night";
import { groupForCandidacy } from "@/lib/party-groups";
import { VOTE_WEIGHTS, readableName, weightFor } from "@/lib/vote-weight";
import styles from "./Papeleta.module.css";

type Muni = { code: string; name: string; provinceCode: string };
type Cand = { id: string; order: number; officialName: string };
const provincesAz = [...VOTE_WEIGHTS].sort((a, b) => readableName(a.name).localeCompare(readableName(b.name), "es"));

export function Papeleta({ headingLevel = 2, initialProvince = "", showPageLink = true }: { headingLevel?: 1 | 2; initialProvince?: string; showPageLink?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Muni[]>([]);
  const [muni, setMuni] = useState<Muni | null>(null);
  const [province, setProvince] = useState(initialProvince);
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2 || (muni && q === muni.name)) { setResults([]); return; }
    timer.current = setTimeout(() => {
      fetch(`/api/territorios?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { municipalities: [] }))
        .then((d) => setResults((d.municipalities ?? []).slice(0, 8)))
        .catch(() => setResults([]));
    }, 200);
  }, [query, muni]);

  useEffect(() => {
    if (!province) { setCands(null); return; }
    let alive = true;
    setError("");
    fetch(`/api/candidaturas?provincia=${province}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setCands([...d.candidacies].sort((a: Cand, b: Cand) => a.order - b.order)); })
      .catch(() => { if (alive) { setCands(null); setError("No se han podido cargar las candidaturas. Inténtalo de nuevo."); } });
    return () => { alive = false; };
  }, [province]);

  const w = province ? weightFor(province) : null;
  const prev = province ? seats2023ForProvince(province) : [];
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className={styles.shell} id="tu-papeleta" aria-labelledby="papeleta-title">
      <div className={styles.head}>
        <div>
          <div className="eyebrow">TU PAPELETA · LO QUE SE VOTA EL DOMINGO DONDE VIVES</div>
          <Heading id="papeleta-title" className={styles.title}>Escribe tu pueblo. <em>Mira tu papeleta.</em></Heading>
          <p className={styles.lead}>Candidaturas oficiales de tu circunscripción, escaños en juego, cómo se repartieron en 2023 y todo lo que necesitas para votar.</p>
        </div>
        {showPageLink && <Link className="text-link" href={BALLOT_PATH}>Guía completa para votar ↗</Link>}
      </div>

      <div className={styles.search}>
        <div className={styles.field}>
          <label htmlFor="papeleta-muni">Tu municipio</label>
          <input id="papeleta-muni" type="search" autoComplete="off" placeholder="Getafe, Lugo, Ponferrada…" value={query}
            onChange={(e) => { setQuery(e.target.value); setMuni(null); }} aria-controls="papeleta-results" />
          {results.length > 0 && (
            <ul id="papeleta-results" className={styles.results} role="listbox" aria-label="Municipios encontrados">
              {results.map((m) => (
                <li key={m.code}>
                  <button type="button" role="option" aria-selected={muni?.code === m.code}
                    onClick={() => { setMuni(m); setQuery(m.name); setResults([]); setProvince(m.provinceCode); }}>
                    {m.name} <span>{readableName(weightFor(m.provinceCode)?.name ?? "")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className={styles.or}>o</span>
        <div className={styles.field}>
          <label htmlFor="papeleta-prov">Tu provincia</label>
          <select id="papeleta-prov" value={province} onChange={(e) => { setProvince(e.target.value); setMuni(null); setQuery(""); }}>
            <option value="">Elige provincia</option>
            {provincesAz.map((p) => <option key={p.provinceCode} value={p.provinceCode}>{readableName(p.name)}</option>)}
          </select>
        </div>
      </div>

      {w && (
        <div className={styles.grid} aria-live="polite">
          <div className={styles.ballot}>
            <div className={styles.ballotTop}>
              <span>CONGRESO DE LOS DIPUTADOS · {readableName(w.name).toUpperCase()}</span>
              <strong>{w.seats} {w.seats === 1 ? "escaño" : "escaños"}</strong>
            </div>
            {muni && <p className={styles.muni}>Votas en <strong>{muni.name}</strong>, dentro de la circunscripción de {readableName(w.name)}.</p>}
            {error && <p role="alert" className={styles.error}>{error}</p>}
            {cands ? (
              <ol className={styles.cands}>
                {cands.map((c) => {
                  const g = groupForCandidacy(c.officialName);
                  return (
                    <li key={c.id} style={{ ["--party" as string]: g.color }}>
                      <span className={styles.order}>{String(c.order).padStart(2, "0")}</span>
                      <span className={styles.cname}>{c.officialName}</span>
                    </li>
                  );
                })}
              </ol>
            ) : !error && <p className={styles.loading}>Cargando candidaturas…</p>}
            <div className={styles.links}>
              <Link href={`/candidaturas?provincia=${w.provinceCode}`}>Ver con logos y fuente BOE ↗</Link>
              <Link href={`/cuanto-vale-mi-voto?provincia=${w.provinceCode}`}>¿Cuánto vale aquí tu voto? ↗</Link>
            </div>
          </div>
          <aside className={styles.side}>
            <h3>Así se repartió en 2023</h3>
            <ul className={styles.prev}>
              {prev.map((x) => (
                <li key={x.id}>
                  <span className={styles.dots} aria-hidden="true">{Array.from({ length: x.seats }, (_, i) => <span key={i} style={{ background: x.color }} />)}</span>
                  <span>{x.name}</span><strong>{x.seats}</strong>
                </li>
              ))}
            </ul>
            <p className={styles.small}>Escaños oficiales de las generales del 23 de julio de 2023 (BOE).</p>
          </aside>
        </div>
      )}

      <dl className={styles.guide}>
        {VOTER_GUIDE.map(([t, d]) => (
          <div key={t}>
            <dt>{t}</dt>
            <dd>{d}{t === "Dónde" && <> <a href={CENSUS_LOOKUP.url} target="_blank" rel="noopener noreferrer">Consultar ↗</a></>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

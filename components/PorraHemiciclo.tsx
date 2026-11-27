"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Hemicycle } from "@/components/Hemicycle";
import { ShareButtons } from "@/components/ShareButtons";
import {
  MAJORITY, PORRA_PARTIES, PORRA_PATH, RESULT_2023, TOTAL_SEATS,
  assigned, decodePrediction, emptyPrediction, encodePrediction, ranking, scorePrediction, summaryText,
  type Prediction,
} from "@/lib/porra";
import { SITE_URL } from "@/lib/seo";
import type { RecuentoPublic } from "@/lib/election-night";
import styles from "./PorraHemiciclo.module.css";

export function PorraHemiciclo({ headingLevel = 2, initial = null, showPageLink = true }: {
  headingLevel?: 1 | 2; initial?: string | null; showPageLink?: boolean;
}) {
  const isPage = !showPageLink;
  const shared = useMemo(() => decodePrediction(initial), [initial]);
  const [p, setP] = useState<Prediction>(() => shared ?? { ...RESULT_2023 });
  const [fromLink, setFromLink] = useState(Boolean(shared));
  const [touched, setTouched] = useState(false);
  const [recuento, setRecuento] = useState<RecuentoPublic | null>(null);

  // La porra no se guarda en ningún sitio: vive en el enlace. En la página de la
  // porra, la dirección se actualiza para que recargar o guardar el enlace la conserve.
  useEffect(() => {
    if (!touched || !isPage || assigned(p) !== TOTAL_SEATS) return;
    window.history.replaceState(null, "", `${PORRA_PATH}?p=${encodePrediction(p)}`);
  }, [p, touched, isPage]);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/recuento", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setRecuento(d as RecuentoPublic); })
      .catch(() => {});
    void load();
    const t = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const total = assigned(p);
  const left = TOTAL_SEATS - total;
  const complete = left === 0;
  const top = ranking(p)[0];
  const edit = (id: string, value: number) => {
    setFromLink(false);
    setTouched(true);
    setP((prev) => {
      const others = assigned(prev) - prev[id];
      const next = Math.max(0, Math.min(Math.round(value) || 0, TOTAL_SEATS - others));
      return { ...prev, [id]: next };
    });
  };
  const fillOthers = () => edit("OTROS", p.OTROS + left);
  const url = `${SITE_URL}${PORRA_PATH}?p=${encodePrediction(p)}`;

  const actual: Prediction | null = recuento && (recuento.status === "live" || recuento.status === "final") && recuento.parties.length
    ? { ...emptyPrediction(), ...Object.fromEntries(recuento.parties.map((x) => [x.id, x.seats])) }
    : null;
  const score = actual && complete ? scorePrediction(p, actual) : null;

  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={styles.shell} id="porra" aria-labelledby="porra-title">
      <div className={styles.head}>
        <div>
          <div className="eyebrow"><span className="dot" /> LA PORRA DEL HEMICICLO · ELECCIONES GENERALES 29-N</div>
          <Heading id="porra-title" className={styles.title}>¿Cómo quedará el Congreso? <em>Haz tu porra.</em></Heading>
          <p className={styles.lead}>
            Reparte los 350 escaños como crees que saldrán el domingo. Compártelo y, a partir de las 21:00 del 29-N,
            compáralo con el recuento oficial.
          </p>
        </div>
        {showPageLink && <Link className="text-link" href={PORRA_PATH}>Abrir la porra ↗</Link>}
      </div>

      {fromLink && (
        <p className={styles.banner} role="status">
          Estás viendo la porra que te han compartido. <button type="button" onClick={() => { setFromLink(false); setTouched(true); setP({ ...RESULT_2023 }); }}>Hacer la mía →</button>
        </p>
      )}

      <div className={styles.grid}>
        <div className={styles.board}>
          <Hemicycle
            label={complete ? "Tu porra del 29-N" : `Te quedan ${left} escaños por repartir`}
            unassignedLabel="Sin repartir"
            unassigned={left}
            groups={PORRA_PARTIES.map((x) => ({ ...x, seats: p[x.id] }))}
          />
          <div className={styles.majority}>
            <span className={styles.majorityBar}><span style={{ width: `${Math.min(100, ((top?.seats ?? 0) / MAJORITY) * 100)}%`, background: top?.color }} /></span>
            <p>
              <strong>Mayoría absoluta: {MAJORITY}.</strong>{" "}
              {top ? (top.seats >= MAJORITY ? `${top.name} la tendría con ${top.seats}.` : `${top.name} sería primera con ${top.seats}: le faltarían ${MAJORITY - top.seats}.`) : "Reparte escaños para empezar."}
            </p>
          </div>
          {complete ? (
            <ShareButtons label="Comparte tu porra" text={summaryText(p)} url={url} />
          ) : (
            <p className={styles.pending}>
              Faltan <strong>{left}</strong> escaños.{" "}
              {left > 0 && <button type="button" className={styles.linkBtn} onClick={fillOthers}>Dárselos a «Otros»</button>}
            </p>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.tools}>
            <span className={complete ? styles.ok : styles.counter}>{total} / {TOTAL_SEATS}</span>
            <button type="button" onClick={() => { setFromLink(false); setTouched(true); setP({ ...RESULT_2023 }); }}>Partir de 2023</button>
            <button type="button" onClick={() => { setFromLink(false); setTouched(true); setP(emptyPrediction()); }}>Vaciar</button>
          </div>
          <ul className={styles.rows}>
            {PORRA_PARTIES.map((x) => (
              <li key={x.id} style={{ ["--party" as string]: x.color }}>
                <span className={styles.swatch} aria-hidden="true" />
                <label htmlFor={`porra-${x.id}`} className={styles.name}>{x.name}</label>
                <button type="button" aria-label={`Quitar 5 escaños a ${x.name}`} onClick={() => edit(x.id, p[x.id] - 5)} disabled={p[x.id] === 0}>−5</button>
                <button type="button" aria-label={`Quitar un escaño a ${x.name}`} onClick={() => edit(x.id, p[x.id] - 1)} disabled={p[x.id] === 0}>−</button>
                <input id={`porra-${x.id}`} inputMode="numeric" value={p[x.id]}
                  onChange={(e) => edit(x.id, Number(e.target.value.replace(/\D/g, "")))} />
                <button type="button" aria-label={`Añadir un escaño a ${x.name}`} onClick={() => edit(x.id, p[x.id] + 1)} disabled={complete}>+</button>
                <button type="button" aria-label={`Añadir 5 escaños a ${x.name}`} onClick={() => edit(x.id, p[x.id] + 5)} disabled={complete}>+5</button>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            «Partir de 2023» carga los escaños oficiales de las generales de 2023 (PSC dentro de PSOE). Tu porra solo existe en su enlace:
            guárdalo o compártelo y ábrelo el domingo a partir de las 21:00 para ver tu puntuación. No recogemos porras.
          </p>
        </div>
      </div>

      {actual && (
        <div className={styles.result} aria-live="polite">
          <div className="eyebrow">{recuento?.status === "final" ? "RESULTADO PROVISIONAL CON EL 100 % ESCRUTADO" : `RECUENTO EN DIRECTO · ${recuento?.scrutinized ?? 0} % ESCRUTADO`}</div>
          {score ? (
            <>
              <h3><strong>{score.points}</strong> puntos de 100</h3>
              <p>
                Has colocado bien <strong>{score.hits}</strong> de 350 escaños.
                {score.winnerRight ? " Acertaste quién queda primero." : " Fallaste el primer partido."}
                {score.majorityRight ? " Y acertaste si hay mayoría absoluta." : " Y fallaste si hay mayoría absoluta."}
              </p>
              <ShareButtons label="Presume de porra" text={`He sacado ${score.points}/100 en la porra del 29-N con ${score.hits} escaños acertados. ¿Y tú?`} url={url} />
            </>
          ) : <p>Completa los 350 escaños para ver tu puntuación frente al recuento.</p>}
          <Link className="text-link" href="/noche-electoral">Ver el recuento completo ↗</Link>
        </div>
      )}
      <p className={styles.legal}>
        <strong>Predicción personal, no un sondeo.</strong> No guardamos porras en el servidor ni publicamos agregados.
      </p>
    </section>
  );
}

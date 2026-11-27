"use client";
import { useState } from "react";
import Link from "next/link";
import { ShareButtons } from "@/components/ShareButtons";
import {
  NATIONAL_AVERAGE_PER_SEAT, VOTE_WEIGHTS, VOTE_WEIGHT_PATH, byWeight, formatInt, formatTimes, readableName, weightFor,
} from "@/lib/vote-weight";
import { SITE_URL } from "@/lib/seo";
import styles from "./VoteWeight.module.css";

const sorted = byWeight();
const lightest = sorted[sorted.length - 1];
const maxPerSeat = lightest.perSeat;
const alphabetical = [...VOTE_WEIGHTS].sort((a, b) => readableName(a.name).localeCompare(readableName(b.name), "es"));

export function VoteWeight({ headingLevel = 2, full = false, initialProvince = "" }: { headingLevel?: 1 | 2; full?: boolean; initialProvince?: string }) {
  const [code, setCode] = useState(initialProvince);
  const pick = (value: string) => setCode(value);
  const w = code ? weightFor(code) : null;
  const name = w ? readableName(w.name) : "";
  const isLightest = w?.provinceCode === lightest.provinceCode;
  const headline = !w ? null : isLightest
    ? `En ${name} un escaño cuesta más habitantes que en ninguna otra circunscripción.`
    : `Un voto en ${name} pesa ${formatTimes(w.vsHeaviest)} veces lo que uno en ${readableName(lightest.name)}.`;
  const shareText = w
    ? `${headline} En ${name} hay ${formatInt(w.perSeat)} habitantes por escaño (media: ${formatInt(NATIONAL_AVERAGE_PER_SEAT)}). ¿Cuánto vale el tuyo?`
    : "";
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const rows = full ? sorted : [...sorted.slice(0, 5), ...sorted.slice(-5)];

  return (
    <section className={styles.shell} id="cuanto-vale-tu-voto" aria-labelledby="vale-title">
      <div className={styles.head}>
        <div>
          <div className="eyebrow">¿CUÁNTO VALE TU VOTO? · DATOS OFICIALES INE Y BOE</div>
          <Heading id="vale-title" className={styles.title}>No todos los votos <em>pesan lo mismo.</em></Heading>
          <p className={styles.lead}>
            Elige tu provincia y mira cuántos habitantes hay detrás de cada diputado. Cuantos menos, más pesa tu papeleta.
          </p>
        </div>
        {!full && <Link className="text-link" href={VOTE_WEIGHT_PATH}>Las 52 circunscripciones ↗</Link>}
      </div>

      <div className={styles.grid}>
        <div className={styles.picker}>
          <label htmlFor="vale-province">Tu provincia o ciudad autónoma</label>
          <select id="vale-province" value={code} onChange={(e) => pick(e.target.value)}>
            <option value="">Elige dónde votas</option>
            {alphabetical.map((x) => <option key={x.provinceCode} value={x.provinceCode}>{readableName(x.name)}</option>)}
          </select>
          {w ? (
            <div className={styles.answer} aria-live="polite">
              <p className={styles.big}>{isLightest ? "×1,0" : `×${formatTimes(w.vsHeaviest)}`}</p>
              <p className={styles.headline}>{headline}</p>
              <dl className={styles.facts}>
                <div><dt>Escaños en juego</dt><dd>{w.seats}</dd></div>
                <div><dt>Habitantes por escaño</dt><dd>{formatInt(w.perSeat)}</dd></div>
                <div><dt>Frente a la media</dt><dd>{w.index >= 1 ? `+${Math.round((w.index - 1) * 100)} %` : `−${Math.round((1 - w.index) * 100)} %`}</dd></div>
                <div><dt>Puesto por peso</dt><dd>{w.rank}.º de 52</dd></div>
              </dl>
              <ShareButtons label="Compártelo" text={shareText} url={`${SITE_URL}${VOTE_WEIGHT_PATH}?provincia=${w.provinceCode}`} />
            </div>
          ) : (
            <p className={styles.hint}>Media nacional: {formatInt(NATIONAL_AVERAGE_PER_SEAT)} habitantes por escaño.</p>
          )}
        </div>

        <figure className={styles.chart}>
          <figcaption>{full ? "Habitantes por escaño en las 52 circunscripciones (de más peso a menos)" : "Las 5 circunscripciones donde más pesa el voto y las 5 donde menos"}</figcaption>
          <ol>
            {rows.map((x, i) => (
              <li key={x.provinceCode} className={`${x.provinceCode === code ? styles.mine : ""} ${!full && i === 5 ? styles.split : ""}`}>
                {!full && i === 5 && <span className={styles.gap} aria-hidden="true">···</span>}
                <span className={styles.rank}>{x.rank}</span>
                <span className={styles.prov}>{readableName(x.name)}</span>
                <span className={styles.track}><span style={{ width: `${(x.perSeat / maxPerSeat) * 100}%` }} /></span>
                <span className={styles.num}>{formatInt(x.perSeat)}</span>
              </li>
            ))}
          </ol>
        </figure>
      </div>
      <p className={styles.legal}>
        Población empadronada a 1/1/2025 (INE) dividida entre los escaños del RD 806/2026. La ley reparte 2 escaños fijos por
        provincia y el resto por población; incluye a menores y residentes sin derecho a voto, así que es la medida del reparto, no del censo.
      </p>
    </section>
  );
}

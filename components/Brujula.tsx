"use client";
import { useState } from "react";
import Link from "next/link";
import { ShareButtons } from "@/components/ShareButtons";
import {
  ANSWER_OPTIONS, AXES, BRUJULA_PATH, STATEMENTS, profileLabel, scoreAxes, territoryLabel, type Answer,
} from "@/lib/brujula";
import { SITE_URL } from "@/lib/seo";
import styles from "./Brujula.module.css";

/** Versión breve para la portada: invita a hacer el test completo. */
export function BrujulaTeaser() {
  return (
    <section className={styles.teaser} aria-labelledby="brujula-teaser-title">
      <div>
        <div className="eyebrow">BRÚJULA ELECTORAL · 18 PREGUNTAS · 2 MINUTOS</div>
        <h2 id="brujula-teaser-title" className={styles.title}>¿Dónde estás tú <em>en el mapa político?</em></h2>
        <p className={styles.lead}>
          Economía, sociedad y modelo territorial. Responde 18 afirmaciones y mira tu posición. Tus respuestas no salen de tu móvil.
        </p>
        <Link className="button" href={BRUJULA_PATH}>Empezar la brújula <span>↗</span></Link>
      </div>
      <Compass e={-0.35} s={0.25} faded />
    </section>
  );
}

function Compass({ e, s, faded = false }: { e: number; s: number; faded?: boolean }) {
  const x = 110 + e * 90;
  const y = 110 + s * 90;
  return (
    <svg className={styles.compass} viewBox="0 0 220 220" role="img"
      aria-label={faded ? "Ejemplo de brújula política" : `Tu posición: economía ${Math.round(e * 100)}, sociedad ${Math.round(s * 100)} sobre 100`}>
      <rect x="20" y="20" width="90" height="90" fill="#e5ece8" />
      <rect x="110" y="20" width="90" height="90" fill="#eef0ea" />
      <rect x="20" y="110" width="90" height="90" fill="#eef0ea" />
      <rect x="110" y="110" width="90" height="90" fill="#e5ece8" />
      <line x1="20" y1="110" x2="200" y2="110" stroke="#142c3b" strokeWidth="1" />
      <line x1="110" y1="20" x2="110" y2="200" stroke="#142c3b" strokeWidth="1" />
      <text x="110" y="13" textAnchor="middle" className={styles.axisLabel}>PROGRESISTA</text>
      <text x="110" y="214" textAnchor="middle" className={styles.axisLabel}>CONSERVADOR</text>
      <text x="24" y="105" textAnchor="start" className={styles.axisLabel}>MÁS ESTADO</text>
      <text x="196" y="105" textAnchor="end" className={styles.axisLabel}>MÁS MERCADO</text>
      <circle cx={x} cy={y} r={faded ? 7 : 9} fill={faded ? "#9fb5ab" : "#a5552a"} stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export function Brujula() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);

  const answer = (value: Answer) => {
    const next = { ...answers, [STATEMENTS[i].id]: value };
    setAnswers(next);
    if (i < STATEMENTS.length - 1) setI(i + 1);
    else setDone(true);
  };
  const restart = () => {
    setAnswers({}); setI(0); setDone(false);
  };

  const score = scoreAxes(answers);
  const profile = profileLabel(score);
  const pctOf = (v: number | null) => Math.round(Math.abs(v ?? 0) * 100);
  const side = (axis: keyof typeof AXES, v: number | null) =>
    v === null ? "sin respuesta" : Math.abs(v) < 0.1 ? "centro" : `${pctOf(v)} % hacia «${v < 0 ? AXES[axis].low : AXES[axis].high}»`;

  if (done) {
    const shareText = `Mi brújula electoral del 29-N: ${profile.title}. Territorio: ${territoryLabel(score.territorio).toLowerCase()}. ¿Y tú dónde estás?`;
    return (
      <div className={styles.quiz}>
        <div className={styles.resultGrid}>
          <Compass e={score.economia ?? 0} s={score.sociedad ?? 0} />
          <div>
            <div className="eyebrow">TU RESULTADO</div>
            <h2 className={styles.result}>{profile.title}</h2>
            <p>{profile.text}</p>
            <ul className={styles.axes}>
              {(Object.keys(AXES) as (keyof typeof AXES)[]).map((a) => (
                <li key={a}>
                  <span className={styles.axisName}>{AXES[a].name}</span>
                  <span className={styles.bar}>
                    <span className={styles.mid} />
                    <span className={styles.marker} style={{ left: `${50 + (score[a] ?? 0) * 50}%` }} />
                  </span>
                  <span className={styles.ends}><span>{AXES[a].low}</span><span>{AXES[a].high}</span></span>
                  <span className={styles.axisValue}>{a === "territorio" ? territoryLabel(score[a]) : side(a, score[a])}</span>
                </li>
              ))}
            </ul>
            <ShareButtons label="Compártelo" text={shareText} url={`${SITE_URL}${BRUJULA_PATH}`} />
            <div className={styles.after}>
              <button type="button" className={styles.linkBtn} onClick={restart}>Volver a empezar</button>
              <Link href="/partidos">Lee las candidaturas y programas de cada partido ↗</Link>
            </div>
          </div>
        </div>
        <p className={styles.legal}>
          <strong>No te decimos a quién votar.</strong> La brújula no te compara con partidos: no hemos verificado sus programas punto por punto
          y asignar posiciones a mano sería opinar por ellos. Tus respuestas no se guardan en ningún sitio: al cerrar la página desaparecen.
        </p>
      </div>
    );
  }

  const st = STATEMENTS[i];
  return (
    <div className={styles.quiz}>
      <div className={styles.progress} aria-label={`Pregunta ${i + 1} de ${STATEMENTS.length}`}>
        <span style={{ width: `${(i / STATEMENTS.length) * 100}%` }} />
      </div>
      <div className={styles.qhead}>
        <span>{String(i + 1).padStart(2, "0")} / {STATEMENTS.length} · {AXES[st.axis].name.toUpperCase()}</span>
        {i > 0 && <button type="button" className={styles.linkBtn} onClick={() => setI(i - 1)}>← Anterior</button>}
      </div>
      <p className={styles.statement} aria-live="polite">{st.text}</p>
      <div className={styles.options} role="group" aria-label="Tu respuesta">
        {ANSWER_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => answer(o.value)}
            className={answers[st.id] === o.value ? styles.picked : ""} aria-pressed={answers[st.id] === o.value}>
            {o.label}
          </button>
        ))}
      </div>
      <button type="button" className={styles.skip} onClick={() => answer(null)}>Sin opinión / saltar</button>
    </div>
  );
}

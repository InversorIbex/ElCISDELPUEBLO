"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Hemicycle } from "./Hemicycle";
import { ProvinceMap, type Winner } from "./ProvinceMap";
import type { LiveResults as Data } from "@/lib/live-results";
import styles from "./LiveResults.module.css";

/* ---------- Un único sondeo de /api/resultados-en-vivo para toda la página ---------- */
type State = { data: Data | null; error: boolean };
let state: State = { data: null, error: false };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
async function load() {
  try {
    const r = await fetch("/api/resultados-en-vivo", { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    state = { data: (await r.json()) as Data, error: false };
  } catch { state = { ...state, error: true }; }
  listeners.forEach((l) => l());
}
export function refreshLiveResults() { void load(); }
function subscribe(l: () => void) {
  listeners.add(l);
  if (!timer) {
    void load();
    timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 10_000);
  }
  return () => { listeners.delete(l); if (!listeners.size && timer) { clearInterval(timer); timer = null; } };
}
const empty: State = { data: null, error: false };
export function useLiveResults(): State {
  return useSyncExternalStore(subscribe, () => state, () => empty);
}
const fmt = new Intl.NumberFormat("es-ES", { useGrouping: "always" } as Intl.NumberFormatOptions);
const pct = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ---------- Contador en la franja superior ---------- */
export function LiveVotersCount() {
  const { data } = useLiveResults();
  if (!data) return null;
  return <span className={styles.counter} aria-live="polite">
    <span className={styles.dot} aria-hidden="true" />
    <strong>{fmt.format(data.totals.shown)}</strong> votos registrados
    {data.includeSimulated && data.totals.simulated > 0 && <em> · demostración: {fmt.format(data.totals.simulated)} simulados</em>}
  </span>;
}

export function DemoNotice() {
  const { data } = useLiveResults();
  if (!data?.includeSimulated || !data.totals.simulated) return null;
  return <p className={styles.demo} role="note">
    <strong>Modo demostración.</strong> Estos resultados incluyen {fmt.format(data.totals.simulated)} votos
    simulados generados automáticamente y {fmt.format(data.totals.real)} votos reales. No reflejan la opinión de nadie.
  </p>;
}

/* ---------- Mapa + panel de circunscripción + hemiciclo ---------- */
export function LiveResultsSection({ provinces, initialProvince = "28" }: { provinces: { code: string; name: string }[]; initialProvince?: string }) {
  const { data, error } = useLiveResults();
  const [selected, setSelected] = useState(initialProvince);
  const names = new Map(provinces.map((p) => [p.code, p.name]));
  const winners: Winner[] = data ? Object.entries(data.provinces).flatMap(([code, p]) =>
    p.winner ? [{ provinceCode: code, name: p.winner.name, color: p.winner.color, responses: p.rows[0]?.n ?? 0, total: p.total }] : []) : [];
  const p = data?.provinces[selected];

  if (data?.blackout) return <section className={styles.blackout} role="status">
    <span className="pill">VEDA ELECTORAL</span>
    <p>Del 24 de noviembre al cierre de los colegios del 29 de noviembre la ley electoral prohíbe difundir sondeos. Los resultados vuelven a mostrarse a partir de las 21:00 (hora peninsular) del 29-N. Puedes seguir participando.</p>
  </section>;

  return <section className={styles.live} aria-labelledby="live-title">
    <div className={styles.head}>
      <div>
        <div className="eyebrow">EN VIVO · SE ACTUALIZA CADA 10 SEGUNDOS</div>
        <h2 id="live-title">Así va el sondeo ciudadano</h2>
        <p>Sondeo voluntario de internautas: no es una encuesta representativa ni una predicción.</p>
      </div>
      <Link className="button" href="/participar">Votar ↗</Link>
    </div>
    <DemoNotice />
    <div className={styles.grid}>
      <ProvinceMap provinces={provinces} winners={winners} selected={selected} onSelect={setSelected} live />
      <aside className={styles.panel} aria-live="polite">
        <div className="eyebrow">CIRCUNSCRIPCIÓN</div>
        <h3>{names.get(selected) ?? selected}</h3>
        {!data ? <p>{error ? "Resultados no disponibles en este momento." : "Cargando resultados…"}</p> : p && <>
          <p className={styles.meta}>{p.seats} {p.seats === 1 ? "escaño" : "escaños"} · {fmt.format(p.total)} votos</p>
          {p.suppressed ? <p className={styles.insufficient}>
            {p.suppressed === "dominance" ? "Una candidatura concentra casi todos los votos: por privacidad solo se publica el total."
              : `Todavía no hay votos suficientes para publicar el reparto (mínimo ${data.minCount}, y también lo deben alcanzar en conjunto las provincias sin publicar).`}
          </p> : <ol className={styles.rows}>
            {p.rows.map((r) => <li key={r.id}>
              <div className={styles.rowHead}>
                <span className={styles.swatch} style={{ background: r.color }} aria-hidden="true" />
                <span className={styles.name} title={r.name}>{r.name}</span>
                <strong>{pct.format(r.pct)} %</strong>
              </div>
              <div className={styles.bar} aria-hidden="true"><span style={{ width: `${r.pct}%`, background: r.color }} /></div>
              <small>{fmt.format(r.n)} votos{r.seats ? ` · ${r.seats} ${r.seats === 1 ? "escaño" : "escaños"}` : ""}</small>
            </li>)}
          </ol>}
          <Link className="text-link" href={`/participar?provincia=${selected}#papeleta`}>Votar en {names.get(selected)} →</Link>
        </>}
      </aside>
    </div>
    {data && <div className={styles.hemi}>
      <div className="eyebrow">CONGRESO · SIMULACIÓN CON LOS VOTOS DE ESTA WEB</div>
      <Hemicycle groups={data.hemicycle.groups} unassigned={data.hemicycle.unassigned}
        label={`Reparto D'Hondt por circunscripción con barrera del 3 %. Las circunscripciones sin votos suficientes quedan sin asignar. No es una predicción.`} />
    </div>}
  </section>;
}

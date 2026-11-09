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
    <strong>{fmt.format(data.totals.votes)}</strong> {data.totals.votes === 1 ? "voto registrado" : "votos registrados"}
  </span>;
}

/* ---------- Hemiciclo: proyección completa o solo provincias con votos ---------- */
function LiveHemicycle({ data }: { data: Data }) {
  const [mode, setMode] = useState<"projection" | "own">("projection");
  const pr = data.projection;
  const v = data.totals.votes;
  const groups = mode === "projection" ? pr.groups : data.hemicycle.groups;
  const unassigned = mode === "projection" ? pr.unassigned : data.hemicycle.unassigned;
  return <div className={styles.hemi}>
    <div className="eyebrow">CONGRESO · PROYECCIÓN CON LOS VOTOS DEL SONDEO</div>
    <p className={styles.basis}>
      Calculada con <strong>{fmt.format(v)} {v === 1 ? "voto" : "votos"}</strong> registrados hasta ahora ·{" "}
      {pr.ownProvinces} {pr.ownProvinces === 1 ? "circunscripción" : "circunscripciones"} con votos propios
      {mode === "projection" && pr.estimatedProvinces > 0 && <> · {pr.estimatedProvinces} sin votos, repartidas a partes iguales</>}
    </p>
    <div className={styles.toggle} role="group" aria-label="Tipo de reparto">
      <button type="button" aria-pressed={mode === "projection"} onClick={() => setMode("projection")}>Proyección de los 350 escaños</button>
      <button type="button" aria-pressed={mode === "own"} onClick={() => setMode("own")}>Solo provincias con votos</button>
    </div>
    <Hemicycle groups={groups} unassigned={unassigned}
      label={mode === "projection"
        ? "Método: en cada circunscripción con votos se aplica D'Hondt con barrera del 3 % a sus votos; en las que aún no tienen votos, los escaños se reparten a partes iguales entre los partidos que ya tienen votos en el sondeo y se presentan allí (si no es divisible, el escaño sobrante va al de más votos nacionales). Sondeo voluntario no representativo: no es una predicción."
        : "Reparto D'Hondt con barrera del 3 % solo en las circunscripciones que ya tienen votos; el resto queda sin asignar."} />
  </div>;
}

/* ---------- Mapa + panel de circunscripción + hemiciclo ---------- */
export function LiveResultsSection({ provinces, initialProvince = "28" }: { provinces: { code: string; name: string }[]; initialProvince?: string }) {
  const { data, error } = useLiveResults();
  const [selected, setSelected] = useState(initialProvince);
  const names = new Map(provinces.map((p) => [p.code, p.name]));
  const winners: Winner[] = data ? Object.entries(data.provinces).flatMap(([code, p]) =>
    p.winner ? [{ provinceCode: code, name: p.winner.name, color: p.winner.color, responses: p.rows[0]?.n ?? 0, total: p.total }] : []) : [];

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
    <div className={styles.grid}>
      <ProvinceMap provinces={provinces} winners={winners} selected={selected} onSelect={setSelected} live />
      <LiveProvincePanel code={selected} name={names.get(selected) ?? selected} />
    </div>
    {data && <LiveHemicycle data={data} />}
  </section>;
}

const n1 = (n: number, one: string, many: string) => `${fmt.format(n)} ${n === 1 ? one : many}`;

/** Votos y porcentaje de cada candidatura en una circunscripción, en vivo. */
export function LiveProvincePanel({ code, name }: { code: string; name: string }) {
  const { data, error } = useLiveResults();
  const p = data?.provinces[code];
  return <aside className={styles.panel} aria-live="polite">
    <div className="eyebrow">CIRCUNSCRIPCIÓN · EN VIVO</div>
    <h3>{name}</h3>
    {!data ? <p>{error ? "Resultados no disponibles en este momento." : "Cargando resultados…"}</p>
      : data.blackout ? <p className={styles.insufficient}>Veda electoral: del 24 de noviembre al cierre de los colegios del 29 de noviembre no se publican resultados del sondeo.</p>
      : p && <>
      <p className={styles.meta}>{n1(p.seats, "escaño", "escaños")} · {n1(p.total, "voto", "votos")}</p>
      {p.total === 0 ? <p className={styles.insufficient}>Todavía nadie ha votado en {name}. ¡Sé el primero!</p>
        : p.suppressed ? <p className={styles.insufficient}>
          {p.suppressed === "dominance" ? "Una candidatura concentra casi todos los votos: por privacidad solo se publica el total."
            : `El reparto se muestra a partir de ${data.minCount} votos.`}
        </p> : <ol className={styles.rows}>
          {p.rows.map((r) => <li key={r.id}>
            <div className={styles.rowHead}>
              <span className={styles.swatch} style={{ background: r.color }} aria-hidden="true" />
              <span className={styles.name} title={r.name}>{r.name}</span>
              <strong>{pct.format(r.pct)} %</strong>
            </div>
            <div className={styles.bar} aria-hidden="true"><span style={{ width: `${r.pct}%`, background: r.color }} /></div>
            <small>{n1(r.n, "voto", "votos")}{r.seats ? ` · ${n1(r.seats, "escaño", "escaños")}` : ""}</small>
          </li>)}
        </ol>}
      <Link className="text-link" href={`/participar?provincia=${code}#papeleta`}>Votar en {name} →</Link>
    </>}
  </aside>;
}

/** Votos y escaños en vivo de una fuerza política en todo el sondeo. */
export function LivePartyStats({ groupId, name }: { groupId: string; name: string }) {
  const { data } = useLiveResults();
  if (!data) return <p className={styles.meta}>Cargando resultados del sondeo…</p>;
  if (data.blackout) return <p className={styles.insufficient}>Veda electoral: del 24 de noviembre al cierre de los colegios del 29 de noviembre no se publican resultados del sondeo.</p>;
  let votes = 0, provincesWon = 0;
  for (const p of Object.values(data.provinces)) {
    for (const r of p.rows) if (r.groupId === groupId) votes += r.n;
    if (p.winner?.groupId === groupId) provincesWon++;
  }
  const seats = data.hemicycle.groups.find((g) => g.id === groupId)?.seats ?? 0;
  const share = data.totals.votes ? (votes / data.totals.votes) * 100 : 0;
  return <dl className={styles.partyStats}>
    <div><dt>Votos en el sondeo</dt><dd>{fmt.format(votes)}</dd><small>{pct.format(share)} % del total</small></div>
    <div><dt>Escaños simulados</dt><dd>{seats}</dd><small>de 350 · D&apos;Hondt por provincia</small></div>
    <div><dt>Provincias donde gana</dt><dd>{provincesWon}</dd><small>de 52 circunscripciones</small></div>
    <p className={styles.partyNote}>Datos en vivo de {name} en el sondeo voluntario de esta web. No es una encuesta representativa ni una predicción.</p>
  </dl>;
}

/** Mapa de provincias coloreado en vivo; al pulsar una provincia se abre su papeleta. */
export function LiveVoteMap({ provinces }: { provinces: { code: string; name: string }[] }) {
  const { data } = useLiveResults();
  const winners: Winner[] = data && !data.blackout ? Object.entries(data.provinces).flatMap(([code, p]) =>
    p.winner ? [{ provinceCode: code, name: p.winner.name, color: p.winner.color, responses: p.rows[0]?.n ?? 0, total: p.total }] : []) : [];
  return <ProvinceMap provinces={provinces} winners={winners} live />;
}

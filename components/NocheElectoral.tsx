"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Hemicycle } from "@/components/Hemicycle";
import { NIGHT_PATH, NIGHT_SCHEDULE, RESULTS_SOURCE, type RecuentoPublic } from "@/lib/election-night";
import { MAJORITY, PORRA_PATH, TOTAL_SEATS } from "@/lib/porra";
import styles from "./NocheElectoral.module.css";

const START = new Date(NIGHT_SCHEDULE[4].at).getTime();
const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d ? `${d} d` : null, `${String(h).padStart(2, "0")} h`, `${String(m).padStart(2, "0")} min`, `${String(sec).padStart(2, "0")} s`].filter(Boolean).join(" ");
}

export function NocheElectoral({ headingLevel = 2, full = false }: { headingLevel?: 1 | 2; full?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  const [data, setData] = useState<RecuentoPublic | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/recuento", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setData(d as RecuentoPublic); })
      .catch(() => {});
    void load();
    const t = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const current = now === null ? -1 : NIGHT_SCHEDULE.reduce((acc, s, i) => (now >= new Date(s.at).getTime() ? i : acc), -1);
  const live = data && (data.status === "live" || data.status === "final");
  const seated = live ? data!.parties.reduce((s, p) => s + p.seats, 0) : 0;
  const leader = live ? data!.parties[0] : null;
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className={styles.shell} id="noche-electoral" aria-labelledby="noche-title">
      <div className={styles.head}>
        <div>
          <div className="eyebrow"><span className={styles.pulse} /> NOCHE ELECTORAL · DOMINGO 29-N · RECUENTO EN DIRECTO</div>
          <Heading id="noche-title" className={styles.title}>
            {live ? <>El recuento, <em>en directo.</em></> : <>A las 21:00, <em>el recuento.</em></>}
          </Heading>
          <p className={styles.lead}>
            Escaños en tiempo real con el escrutinio oficial del Ministerio del Interior, la participación de la jornada y tu porra frente al resultado.
          </p>
        </div>
        {!full && <Link className="text-link" href={NIGHT_PATH}>Abrir la noche electoral ↗</Link>}
      </div>

      {!live && (
        <div className={styles.countdown} aria-live="off">
          <span>Empieza en</span>
          <strong suppressHydrationWarning>{now === null ? "—" : now >= START ? "unos instantes" : countdown(START - now)}</strong>
          <Link className="button" href={PORRA_PATH}>Haz tu porra antes <span>↗</span></Link>
        </div>
      )}

      {live && (
        <div className={styles.live}>
          <div>
            <Hemicycle
              label={data!.status === "final" ? "Escrutinio al 100 %" : `Escrutado: ${data!.scrutinized ?? 0} %`}
              unassignedLabel="Por decidir"
              unassigned={TOTAL_SEATS - seated}
              groups={data!.parties.map((p) => ({ id: p.id, name: p.name, color: p.color, seats: p.seats }))}
            />
          </div>
          <div>
            <p className={styles.leader}>
              {leader ? (leader.seats >= MAJORITY
                ? <><strong>{leader.name}</strong> tiene mayoría absoluta con {leader.seats} escaños.</>
                : <><strong>{leader.name}</strong> va primera con {leader.seats}. Mayoría absoluta: {MAJORITY}.</>) : null}
            </p>
            <table className={styles.table}>
              <thead><tr><th scope="col">Partido</th><th scope="col">Escaños</th><th scope="col">% votos</th></tr></thead>
              <tbody>
                {data!.parties.map((p) => (
                  <tr key={p.id}>
                    <th scope="row"><span className={styles.sw} style={{ background: p.color }} aria-hidden="true" />{p.name}</th>
                    <td>{p.seats}</td>
                    <td>{p.votesPct === null ? "—" : `${num.format(p.votesPct)} %`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.small}>
              Fuente: escrutinio provisional, <a href={RESULTS_SOURCE.url} target="_blank" rel="noopener noreferrer">{RESULTS_SOURCE.name}</a>.
              {data!.updatedAt && <> Actualizado a las {new Date(data!.updatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}.</>}
            </p>
            <Link className="button" href={PORRA_PATH}>¿Cuántos puntos saca tu porra? <span>↗</span></Link>
          </div>
        </div>
      )}

      {data && data.turnoutUpdates.length > 0 && (
        <div className={styles.turnout}>
          <h3>Participación</h3>
          <ul>
            {data.turnoutUpdates.map((u) => (
              <li key={u.time}>
                <span>{u.time}</span>
                <strong>{num.format(u.pct)} %</strong>
                {u.pct2023 !== null && <small>{u.pct >= u.pct2023 ? "+" : "−"}{num.format(Math.abs(u.pct - u.pct2023))} frente a 2023</small>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className={styles.schedule}>
        {NIGHT_SCHEDULE.map((s, i) => (
          <li key={s.at} className={i === current ? styles.now : i < current ? styles.past : ""}>
            <span className={styles.time}>{s.time}</span>
            <div>
              <strong>{s.title}</strong>
              {(full || i >= 3) && <p>{s.text}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className={styles.legal}>
        Hasta las 21:00 del 29-N no publicamos estimaciones ni sondeos (LOREG, art. 69.7). Los escaños solo salen del escrutinio oficial.
      </p>
    </section>
  );
}

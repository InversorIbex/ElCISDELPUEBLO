"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { hemicyclePoints } from "@/lib/parliament";
import { PORRA_PARTIES, PORRA_PATH, TOTAL_SEATS, decodePrediction, ranking as seatsOf } from "@/lib/porra";
import styles from "./PorraTodos.module.css";

type Row = { position: number; alias: string; code: string; points: number | null; hits: number | null };
type Data = {
  enabled: boolean; rankingFrom: string; mine: { alias: string; code: string } | null;
  recuentoStatus?: string | null; scrutinized?: number | null; scored?: boolean;
  ranking: Row[]; matches?: number; total: number; myPosition: Row | null;
};

const POINTS = hemicyclePoints(TOTAL_SEATS);
const fromText = (iso: string) => new Date(iso).toLocaleString("es-ES", {
  weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
});

/** Hemiciclo pequeño de una porra (mismo dibujo que la imagen para compartir). */
function MiniHemicycle({ code, label }: { code: string; label: string }) {
  const colors = useMemo(() => {
    const p = decodePrediction(code);
    return p ? PORRA_PARTIES.flatMap((x) => Array.from({ length: p[x.id] }, () => x.color)) : [];
  }, [code]);
  return (
    <svg viewBox="0 0 420 220" className={styles.hemi} role="img" aria-label={label}>
      {POINTS.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r={4.1} fill={colors[i] ?? "#dce2d7"} />)}
    </svg>
  );
}

/** Página con la porra de cada persona apuntada. Nada antes del fin de la veda (21:00 del 29-N). */
export function PorraTodos() {
  const [data, setData] = useState<Data | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback((from: number, q: string) =>
    fetch(`/api/porra?desde=${from}&q=${encodeURIComponent(q)}`, { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json() as Promise<Data>), []);
  const load = useCallback(() => fetchPage(0, query)
    .then((d) => { if (d && Array.isArray(d.ranking)) { setData(d); setRows(d.ranking); } })
    .catch(() => {}), [fetchPage, query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && rows.length <= 50) void load();
    }, 60_000);
    return () => clearInterval(t);
  }, [load, rows.length]);

  async function more() {
    setLoadingMore(true);
    try {
      const d = await fetchPage(rows.length, query);
      setRows((prev) => [...prev, ...d.ranking.filter((r) => !prev.some((x) => x.alias === r.alias))]);
    } catch { /* sin conexión */ } finally { setLoadingMore(false); }
  }

  if (!data) return <p className={styles.note}>Cargando porras…</p>;
  const open = Date.now() >= Date.parse(data.rankingFrom);
  const matches = data.matches ?? data.total;

  if (!open) {
    return (
      <div className={styles.wait}>
        <p>
          Por la veda electoral, las porras de los demás se publican a partir del <strong>{fromText(data.rankingFrom)}</strong> (hora peninsular),
          cuando cierran los últimos colegios. Desde ese momento verás aquí a cada participante con su hemiciclo y, con el recuento, quién se acerca más.
        </p>
        {data.mine
          ? <p>Tu porra está apuntada como <strong>{data.mine.alias}</strong>. <Link href={`${PORRA_PATH}?p=${data.mine.code}`}>Ver la tuya</Link></p>
          : <p><Link className="button" href={`${PORRA_PATH}#clasificacion`}>Apunta tu porra ↗</Link></p>}
      </div>
    );
  }
  if (!data.total) return <p className={styles.note}>Todavía no hay porras apuntadas.</p>;

  return (
    <>
      <p className={styles.note}>
        {data.total} {data.total === 1 ? "porra apuntada" : "porras apuntadas"}.{" "}
        {data.scored
          ? `Ordenadas por puntos frente al recuento (${data.recuentoStatus === "final" ? "100 %" : `${data.scrutinized ?? 0} %`} escrutado).`
          : "En cuanto el recuento tenga escaños, se ordenan por puntos."}
      </p>
      {data.myPosition && data.scored && (
        <p className={styles.mine}>Vas <strong>{data.myPosition.position}.º</strong> de {data.total} con <strong>{data.myPosition.points}</strong> puntos.</p>
      )}
      <label className={styles.search}>
        <span>Busca un apodo</span>
        <input type="search" value={query} maxLength={24} onChange={(e) => setQuery(e.target.value)} placeholder="Ej.: tu cuñado" />
      </label>
      <ol className={styles.grid}>
        {rows.map((r) => {
          const seats = seatsOf(decodePrediction(r.code) ?? {});
          const split = seats.map((x) => `${x.name} ${x.seats}`).join(", ");
          return (
            <li key={r.alias} className={`${styles.card} ${data.mine?.alias === r.alias ? styles.me : ""}`}>
              <div className={styles.top}>
                {data.scored && <span className={styles.pos}>{r.position}.º</span>}
                <span className={styles.alias}>{r.alias}</span>
                {r.points !== null && <span className={styles.pts}>{r.points}<small> pts</small></span>}
              </div>
              <MiniHemicycle code={r.code} label={`Porra de ${r.alias}: ${split}`} />
              <ul className={styles.parties}>
                {seats.slice(0, 6).map((x) => (
                  <li key={x.id}><span style={{ background: x.color }} aria-hidden="true" />{x.name} <strong>{x.seats}</strong></li>
                ))}
              </ul>
              <div className={styles.foot}>
                {r.hits !== null && <span>{r.hits} escaños acertados</span>}
                <Link href={`${PORRA_PATH}?p=${r.code}`}>Ver porra ↗</Link>
              </div>
            </li>
          );
        })}
      </ol>
      {!rows.length && <p className={styles.note}>Ningún apodo coincide con «{query}».</p>}
      {rows.length < matches && (
        <button type="button" className={styles.more} onClick={more} disabled={loadingMore}>
          {loadingMore ? "Cargando…" : `Ver más (${matches - rows.length})`}
        </button>
      )}
    </>
  );
}

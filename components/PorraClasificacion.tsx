"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { PORRA_CLOSES_AT, PORRA_PATH, cleanAlias } from "@/lib/porra";
import styles from "./PorraClasificacion.module.css";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

type Row = { position: number; alias: string; code: string; points: number; hits: number; error: number };
type State = {
  enabled: boolean; open: boolean; rankingFrom: string;
  mine: { alias: string; code: string } | null;
  recuentoStatus?: string | null; scrutinized?: number | null;
  ranking: Row[]; total: number; myPosition: Row | null;
};

const userErrors: Record<string, string> = {
  ALIAS_TAKEN: "Ese apodo ya lo usa otra persona. Prueba con otro.",
  INVALID_ALIAS: "El apodo debe tener de 2 a 24 letras o números (sin enlaces).",
  INVALID_PREDICTION: "La porra tiene que repartir los 350 escaños.",
  IP_WINDOW_LIMIT: "Desde esta conexión ya se han apuntado varias porras en la última hora. Inténtalo más tarde.",
  CHALLENGE_INVALID: "No se ha superado la comprobación antirobots. Inténtalo de nuevo.",
  SESSION_REQUIRED: "No se pudo preparar tu sesión privada. Recarga la página.",
  CLOSED: "Ya no se pueden apuntar porras.",
  TEMPORARILY_UNAVAILABLE: "El servidor no ha confirmado tu porra. No se ha apuntado.",
};
const closesText = PORRA_CLOSES_AT.toLocaleString("es-ES", {
  weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
});

/**
 * Apuntarse a la clasificación de la porra y, tras la veda, verla. Antes de
 * las 21:00 del 29-N no se muestra ninguna porra ajena ni cuántas hay.
 */
export function PorraClasificacion({ code, onLoad }: { code: string | null; onLoad?: (code: string) => void }) {
  const [state, setState] = useState<State | null>(null);
  const [siteKey, setSiteKey] = useState<string | undefined>();
  const [alias, setAlias] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  const load = useCallback(() => fetch("/api/porra", { cache: "no-store", credentials: "same-origin" })
    .then((r) => r.json())
    .then((d) => { if (d && typeof d.open === "boolean") setState(d as State); })
    .catch(() => {}), []);

  useEffect(() => {
    void load();
    fetch("/api/participaciones", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setSiteKey(s?.enabled ? s.siteKey : undefined))
      .catch(() => {});
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() >= Date.parse(state?.rankingFrom ?? "2100-01-01")) void load();
    }, 60_000);
    return () => clearInterval(t);
  }, [load, state?.rankingFrom]);

  useEffect(() => { if (state?.mine && !alias) setAlias(state.mine.alias); }, [state?.mine, alias]);

  const canSubmit = Boolean(state?.enabled && state.open && siteKey);
  useEffect(() => {
    if (!canSubmit || !scriptReady || !widgetRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey, action: "porra",
      callback: (v: string) => setToken(v),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }, [canSubmit, scriptReady, siteKey]);
  useEffect(() => () => {
    if (widgetId.current && window.turnstile) { window.turnstile.remove(widgetId.current); widgetId.current = null; }
  }, []);

  async function submit() {
    if (!code || !consent || !token || busy || !cleanAlias(alias)) return;
    setBusy(true); setError(""); setMsg("");
    try {
      const session = await fetch("/api/vote-session", { method: "POST", credentials: "same-origin", headers: { "x-vote-request": "1" } });
      if (!session.ok) throw new Error("SESSION_REQUIRED");
      const r = await fetch("/api/porra", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "x-vote-request": "1" },
        body: JSON.stringify({ alias, code, turnstileToken: token, explicitConsent: true }),
      });
      const d = await r.json() as { recorded?: boolean; code?: string; error?: string; mine?: State["mine"] };
      if (r.ok && d.recorded) {
        setState((s) => (s ? { ...s, mine: d.mine ?? null } : s));
        setMsg(d.code === "UPDATED" ? "Hecho: tu porra apuntada se ha cambiado por esta." : "Hecho: tu porra está apuntada. Vuelve el domingo a partir de las 21:00.");
      } else setError(userErrors[d.code ?? d.error ?? ""] ?? "No se pudo apuntar la porra.");
    } catch {
      setError("No se pudo apuntar la porra. Comprueba la conexión e inténtalo de nuevo.");
    } finally {
      setBusy(false); setToken("");
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    }
  }

  if (!state) return null;
  const rankingOpen = Date.now() >= Date.parse(state.rankingFrom);
  const same = state.mine && code === state.mine.code;
  const validAlias = Boolean(cleanAlias(alias));

  return (
    <section className={styles.box} id="clasificacion" aria-labelledby="clasificacion-title">
      <div className="eyebrow">CLASIFICACIÓN DE LA PORRA</div>
      <h2 id="clasificacion-title" className={styles.title}>¿Quién se acerca más?</h2>

      {state.mine && (
        <p className={styles.mine}>
          Tienes apuntada la porra de <strong>{state.mine.alias}</strong>.{" "}
          {!same && onLoad && <button type="button" className={styles.link} onClick={() => onLoad(state.mine!.code)}>Ver la que apuntaste</button>}
        </p>
      )}

      {state.open && canSubmit && (
        <div className={styles.form}>
          <p className={styles.lead}>
            Apunta tu porra con un apodo y entra en la clasificación. Puedes cambiarla hasta el {closesText}.
            Hasta las 21:00 del 29-N nadie ve las porras de los demás.
          </p>
          {!code ? <p className={styles.note}>Reparte los 350 escaños para poder apuntarla.</p> : same ? (
            <p className={styles.note}>Esta es la porra que tienes apuntada.</p>
          ) : (
            <>
              <label className={styles.field}>
                <span>Apodo público</span>
                <input value={alias} maxLength={24} onChange={(e) => setAlias(e.target.value)} placeholder="Ej.: LaVecinaDel5º" autoComplete="nickname" />
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>Acepto que mi apodo y mi porra aparezcan en la clasificación pública a partir de las 21:00 del 29-N. No uses tu nombre real si no quieres.</span>
              </label>
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
              <div ref={widgetRef} />
              <button type="button" className="button" disabled={!consent || !token || busy || !validAlias} onClick={submit}>
                {busy ? "Apuntando…" : state.mine ? "Cambiar mi porra apuntada por esta" : "Apuntar mi porra"}
              </button>
            </>
          )}
          {msg && <p className={styles.ok} role="status">{msg}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
      )}
      {state.open && !canSubmit && !rankingOpen && (
        <p className={styles.note}>La clasificación todavía no está abierta. Mientras tanto, guarda el enlace de tu porra.</p>
      )}
      {!state.open && !rankingOpen && (
        <p className={styles.note}>Ya no se pueden apuntar porras. La clasificación se publica a partir de las 21:00 (hora peninsular), con el recuento.</p>
      )}

      {rankingOpen && (state.ranking.length ? (
        <>
          <p className={styles.note}>
            {state.recuentoStatus === "final" ? "Con el 100 % escrutado" : `Con el ${state.scrutinized ?? 0} % escrutado`} · {state.total} porras.
            Puntos sobre 100: escaños bien colocados, más bonus por acertar el primer partido y si hay mayoría absoluta.
          </p>
          {state.myPosition && (
            <p className={styles.mine}>Vas <strong>{state.myPosition.position}.º</strong> de {state.total} con <strong>{state.myPosition.points}</strong> puntos.</p>
          )}
          <ol className={styles.table}>
            {state.ranking.map((r) => (
              <li key={r.alias} className={state.mine?.alias === r.alias ? styles.me : undefined}>
                <span className={styles.pos}>{r.position}</span>
                <a className={styles.alias} href={`${PORRA_PATH}?p=${r.code}`}>{r.alias}</a>
                <span className={styles.pts}>{r.points}<small> pts</small></span>
                <span className={styles.hits}>{r.hits} escaños</span>
              </li>
            ))}
          </ol>
        </>
      ) : <p className={styles.note}>La clasificación aparece en cuanto el recuento oficial tenga escaños.</p>)}
    </section>
  );
}

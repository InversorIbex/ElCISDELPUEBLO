"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import {
  DEBATE_OPTIONS,
  DEBATE_PATH,
  DEBATE_VOTE_CLOSES_AT,
  type DebateOptionId,
} from "@/lib/debate";
import styles from "./DebatePoll.module.css";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

type Shares = { enabled?: boolean; open: boolean; hasVotes: boolean; shares: Record<DebateOptionId, number> };
type VoteStatus = { enabled: boolean; siteKey?: string };

const pct = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const deadline = DEBATE_VOTE_CLOSES_AT.toLocaleString("es-ES", {
  weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
});

const userErrors: Record<string, string> = {
  IP_WINDOW_LIMIT: "Desde esta conexión ya se han registrado dos votos en las últimas 5 horas.",
  BROWSER_LIMIT: "Ya se ha registrado un voto sobre el debate desde este navegador.",
  ALREADY_SUBMITTED: "Esta solicitud ya se procesó.",
  CHALLENGE_INVALID: "No se ha superado la comprobación antirobots. Inténtalo de nuevo.",
  SESSION_REQUIRED: "No se pudo preparar tu sesión privada. Recarga la página.",
  CLOSED: "La votación sobre el debate ya está cerrada.",
  TEMPORARILY_UNAVAILABLE: "El servidor no ha confirmado el voto. No se ha contado.",
};

export function DebatePoll({ headingLevel = 2, showPageLink = true }: { headingLevel?: 1 | 2; showPageLink?: boolean }) {
  const [data, setData] = useState<Shares | null>(null);
  const [status, setStatus] = useState<VoteStatus | null>(null);
  const [selected, setSelected] = useState<DebateOptionId | null>(null);
  const [voted, setVoted] = useState<DebateOptionId | null>(null);
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/debate", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && d.shares) setData(d as Shares); })
      .catch(() => {});
    void load();
    fetch("/api/participaciones", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (alive) setStatus(s ? { enabled: Boolean(s.enabled), siteKey: s.siteKey } : { enabled: false }); })
      .catch(() => { if (alive) setStatus({ enabled: false }); });
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const open = data ? data.open : Date.now() <= DEBATE_VOTE_CLOSES_AT.getTime();
  const canVote = Boolean(status?.enabled && status.siteKey && open && !voted);

  useEffect(() => {
    if (!canVote || !selected || !scriptReady || !widgetRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: status!.siteKey, action: "debate_vote",
      callback: (value: string) => setToken(value),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }, [canVote, selected, scriptReady, status]);
  useEffect(() => () => {
    if (widgetId.current && window.turnstile) { window.turnstile.remove(widgetId.current); widgetId.current = null; }
  }, []);

  async function submit() {
    if (!canVote || !selected || !consent || !token || busy) return;
    setBusy(true); setError("");
    try {
      const session = await fetch("/api/vote-session", { method: "POST", credentials: "same-origin", headers: { "x-vote-request": "1" } });
      if (!session.ok) throw new Error("SESSION_REQUIRED");
      const response = await fetch("/api/debate", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "x-vote-request": "1" },
        body: JSON.stringify({ optionId: selected, requestToken: crypto.randomUUID(), turnstileToken: token, explicitConsent: true }),
      });
      const result = await response.json() as Shares & { recorded?: boolean; code?: string; error?: string };
      if (response.ok && result.recorded) {
        setVoted(selected);
        if (result.shares) setData(result);
        return;
      }
      // No se guarda la opinión en el navegador: el servidor avisa si ya votó.
      setError(userErrors[result.code ?? result.error ?? ""] ?? "No se pudo registrar el voto. No se ha contado.");
    } catch {
      setError("No se pudo registrar el voto. Comprueba la conexión e inténtalo de nuevo.");
    } finally {
      setBusy(false); setToken("");
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    }
  }

  const Heading = headingLevel === 1 ? "h1" : "h2";
  const statusText = !open
    ? "La votación está cerrada. Este es el resultado final."
    : voted
      ? "Gracias. Tu voto está registrado."
      : status && !status.enabled
        ? "La votación todavía no está abierta."
        : `Elige una opción. Se puede votar hasta el ${deadline}.`;

  return (
    <section className={styles.shell} id="debate" aria-labelledby="debate-title">
      <div className={styles.head}>
        <div>
          <div className="eyebrow"><span className="dot" /> DEBATE A CUATRO · ELECCIONES GENERALES 29-N</div>
          <Heading id="debate-title" className={styles.title}>¿Quién crees que ganó el debate?</Heading>
          <p className={styles.status} aria-live="polite">{statusText}</p>
        </div>
        {showPageLink && <Link className="text-link" href={DEBATE_PATH}>Sobre el debate ↗</Link>}
      </div>

      <div className={styles.options} role="group" aria-label="Opciones de voto">
        {DEBATE_OPTIONS.map((o) => {
          const active = (voted ?? selected) === o.id;
          return (
            <button key={o.id} type="button" style={{ ["--party" as string]: o.color }}
              className={`${styles.option} ${active ? styles.active : ""}`}
              aria-pressed={active} disabled={!canVote || busy}
              onClick={() => { setSelected(o.id); setError(""); }}>
              <span className={styles.face}>
                {o.photo
                  ? <img src={o.photo} alt="" width={72} height={72} />
                  : <span className={styles.none} aria-hidden="true">∅</span>}
                {o.logo && <span className={styles.logo}><img src={o.logo} alt={o.party ?? ""} width={44} height={26} loading="lazy" /></span>}
              </span>
              <span className={styles.name}>{o.name}</span>
              <span className={styles.party}>{o.party ?? "Ninguno lo hizo mejor"}</span>
              {voted === o.id && <span className={styles.mine}>Tu voto</span>}
            </button>
          );
        })}
      </div>

      {canVote && selected && (
        <div className={styles.confirm}>
          <p><strong>Tu elección:</strong> {DEBATE_OPTIONS.find((o) => o.id === selected)?.name}</p>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>He leído la <a href="/privacidad" target="_blank" rel="noreferrer">información de privacidad</a> y consiento que se registre mi respuesta de forma anónima. Solo se guarda el recuento de cada opción y no podré cambiarla después.</span>
          </label>
          <div ref={widgetRef} className={styles.captcha} aria-label="Verificación antirobots" />
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive" onReady={() => setScriptReady(true)} />
          <button type="button" className="button" disabled={!consent || !token || busy} onClick={submit}>
            {busy ? "Registrando…" : "Enviar mi voto"} <span>↗</span>
          </button>
        </div>
      )}
      {error && <p role="alert" className={styles.error}>{error}</p>}

      <figure className={styles.chart}>
        <figcaption>{data?.hasVotes ? "Porcentaje de votos de cada opción" : "Todavía no hay votos. El gráfico se llena con el primero."}</figcaption>
        <div className={styles.cols} aria-hidden="true">
          {DEBATE_OPTIONS.map((o) => {
            const value = data?.hasVotes ? data.shares[o.id] : 0;
            return (
              <div key={o.id} className={styles.col} style={{ ["--party" as string]: o.color, ["--value" as string]: `${value}%` }}
                title={`${o.name}${o.party ? ` (${o.party})` : ""}: ${pct.format(value)} %`}>
                <span className={styles.track}>
                  <span className={styles.bar} />
                  <span className={styles.pct}>{data?.hasVotes ? `${pct.format(value)} %` : "–"}</span>
                </span>
                <span className={styles.axis}>{o.party ?? o.name}</span>
              </div>
            );
          })}
        </div>
        <ul className={styles.srOnly}>
          {DEBATE_OPTIONS.map((o) => (
            <li key={o.id}>{o.name}{o.party ? ` (${o.party})` : ""}: {pct.format(data?.hasVotes ? data.shares[o.id] : 0)} %</li>
          ))}
        </ul>
      </figure>
      <p className={styles.legal}>
        <strong>Pregunta sobre el debate, no sobre intención de voto.</strong> Votación voluntaria de internautas, no representativa. Solo publicamos el porcentaje de cada opción, nunca el número de votos.
      </p>
    </section>
  );
}

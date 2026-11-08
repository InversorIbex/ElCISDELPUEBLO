"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { logoForCandidacy } from "@/lib/candidacies/logos";
import type { Candidacy } from "@/lib/candidacies/registry";
import styles from "./BallotPreview.module.css";

type VoteStatus={enabled:boolean;mode:string;consentVersion?:string;siteKey?:string};
type TurnstileApi={
  render: (container:HTMLElement, options:Record<string,unknown>)=>string;
  reset: (widgetId:string)=>void;
  remove: (widgetId:string)=>void;
};
declare global { interface Window { turnstile?:TurnstileApi } }

const userErrors:Record<string,string>={
  IP_DAILY_LIMIT:"Este acceso a Internet ha alcanzado el límite de dos participaciones de hoy.",
  DESKTOP_BROWSER_LIMIT:"Este navegador ha alcanzado el límite de dos participaciones de hoy.",
  MOBILE_BROWSER_LIMIT:"Ya se ha registrado una participación con este navegador móvil para el sondeo.",
  INVALID_CANDIDACY:"La candidatura no corresponde a la provincia seleccionada.",
  ALREADY_SUBMITTED:"Esta solicitud ya se procesó. Consulta el estado antes de volver a enviarla.",
  CHALLENGE_INVALID:"No se ha superado la comprobación antirobots. Inténtalo de nuevo.",
  SESSION_REQUIRED:"No se pudo preparar tu sesión privada. Recarga la página.",
  TEMPORARILY_UNAVAILABLE:"El servidor no ha confirmado el registro. No se contabiliza como voto guardado.",
};
export function BallotPreview({candidacies,provinceName,provinceCode}:{
  candidacies:readonly Candidacy[];provinceName:string;provinceCode:string;
}) {
  const [selected,setSelected]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState<VoteStatus|null>(null);
  const [consent,setConsent]=useState(false);
  const [token,setToken]=useState("");
  const [busy,setBusy]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");
  const widgetRef=useRef<HTMLDivElement|null>(null);
  const widgetId=useRef<string|null>(null);
  const pending=useRef(false);
  useEffect(()=>{
    let alive=true;
    fetch("/api/participaciones",{cache:"no-store"})
      .then(async r=>r.ok?await r.json():null)
      .then(data=>{if(alive)setStatus(data)})
      .catch(()=>{if(alive)setStatus({enabled:false,mode:"closed"})});
    return()=>{alive=false};
  },[]);
  const enabled=Boolean(status?.enabled&&status.siteKey&&status.consentVersion);
  const chosen=candidacies.find(c=>c.id===selected);
  const filtered=candidacies.filter(c=>c.officialName.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es").trim()));
  function renderTurnstile(){
    if(!enabled||!widgetRef.current||!window.turnstile||widgetId.current)return;
    widgetId.current=window.turnstile.render(widgetRef.current,{
      sitekey:status!.siteKey,action:"citizen_vote",
      callback:(value:string)=>setToken(value),
      "expired-callback":()=>setToken(""),
      "error-callback":()=>setToken(""),
    });
  }
  useEffect(()=>{
    if(enabled)renderTurnstile();
    return()=>{if(widgetId.current && window.turnstile){window.turnstile.remove(widgetId.current);widgetId.current=null}};
  },[enabled]);
  async function submit(){
    if(!enabled||!chosen||!consent||!token||!status?.consentVersion||busy||saved||pending.current)return;
    pending.current=true;setBusy(true);setError("");
    try{
      const session=await fetch("/api/vote-session",{
        method:"POST",credentials:"same-origin",headers:{"x-vote-request":"1"},
      });
      if(!session.ok)throw new Error("SESSION_REQUIRED");
      const response=await fetch("/api/participaciones",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json","x-vote-request":"1"},
        body:JSON.stringify({provinceCode,candidacyId:chosen.id,requestToken:crypto.randomUUID(),
          turnstileToken:token,explicitConsent:true,consentVersion:status.consentVersion}),
      });
      const data=await response.json() as {recorded?:boolean;code?:string;error?:string};
      if(response.ok&&data.recorded===true){setSaved(true);setConfirmed(true);return;}
      setError(userErrors[data.code??data.error??""]??"No se pudo confirmar el registro. No se ha contado tu voto.");
    }catch{setError("No se pudo confirmar el registro. Comprueba la conexión antes de intentarlo de nuevo.");}
    finally {
      setBusy(false);pending.current=false;setToken("");
      if(widgetId.current&&window.turnstile)window.turnstile.reset(widgetId.current);
    }
  }
  return <section className={styles.shell} aria-labelledby="ballot-preview-title">
    <div className={styles.head}>
      <div>
        <span className={styles.kicker}>EL PUEBLO OPINA · SONDEO VOLUNTARIO</span>
        <h2 id="ballot-preview-title">¿Qué opción elegirías en {provinceName}?</h2>
        <p>{enabled?"Elige una candidatura y confirma tu participación.": "Consulta las candidaturas proclamadas. La votación todavía no está abierta y aquí no se guardan respuestas."}</p>
      </div>
      <span className={styles.closed}>{enabled?"Participación abierta":"Sondeo todavía cerrado"}</span>
    </div>
    <label className={styles.fieldLabel} htmlFor="ballot-search">Buscar candidatura por nombre</label>
    <input className={styles.search} id="ballot-search" type="search" value={search}
      placeholder="Buscar en la papeleta…" onChange={e=>setSearch(e.target.value)}/>
    <div className={styles.options} role="group" aria-label={`Candidaturas de ${provinceName}`}>
      {filtered.map(c=>{
        const logo=logoForCandidacy(c.officialName);
        return <button className={`${styles.option} ${selected===c.id?styles.active:""}`}
          disabled={saved||busy} type="button" key={c.id}
          aria-pressed={selected===c.id}
          onClick={()=>{setSelected(c.id);setConfirmed(false);setError("");setToken("");
            if(widgetId.current&&window.turnstile)window.turnstile.reset(widgetId.current);}}>
          <span className={styles.logo}>{logo?<img width="56" height="42" src={logo.path} alt="" loading="lazy"/>:<span aria-hidden="true">—</span>}</span>
          <span className={styles.name}>{c.officialName}</span>
          <span className={styles.marker} aria-hidden="true">{selected===c.id?"✓":"○"}</span>
        </button>;
      })}
    </div>
    {!filtered.length&&<p role="status">No se encuentran candidaturas con ese texto.</p>}
    <div className={styles.confirm}>
      {chosen?<p><strong>Selección:</strong> {chosen.officialName}</p>:<p>Selecciona una candidatura para revisar tu respuesta.</p>}
      {enabled&&!saved ? <>
        <label className={styles.checkbox}><input type="checkbox" checked={consent}
          onChange={e=>setConsent(e.target.checked)}/>
          <span>He leído la <a href="/privacidad" target="_blank" rel="noreferrer">información de privacidad</a> y consiento expresamente el tratamiento de mi respuesta política para este sondeo voluntario.</span>
        </label>
        <div ref={widgetRef} className={styles.captcha} aria-label="Verificación antirobots"/>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive" onReady={renderTurnstile}/>
        <button type="button" disabled={!chosen||!consent||!token||busy}
          onClick={submit}>{busy?"Verificando y registrando…":"Registrar mi respuesta"}</button>
      </> : !saved && <button type="button" disabled={!chosen} onClick={()=>setConfirmed(true)}>
        Revisar mi selección de demostración
      </button>}
      {error&&<p role="alert" className={styles.error}>{error}</p>}
      {saved&&<p role="status" className={styles.ack}>Respuesta registrada y confirmada por el servidor. Gracias por participar.</p>}
      {confirmed&&!saved&&chosen&&<p role="status" className={styles.ack}>Has seleccionado «{chosen.officialName}» en la demostración. No se ha registrado ningún voto.</p>}
    </div>
    <p className={styles.legal}><strong>No es una elección oficial.</strong> Sondeo voluntario no representativo, sin inferencias sobre el electorado. La provincia se selecciona manualmente.</p>
  </section>;
}

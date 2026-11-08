"use client";
import { useState } from "react";
import { logoForCandidacy } from "@/lib/candidacies/logos";
import type { Candidacy } from "@/lib/candidacies/registry";
import styles from "./BallotPreview.module.css";

export function BallotPreview({ candidacies, provinceName }: { candidacies: readonly Candidacy[]; provinceName: string }) {
  const [selected, setSelected] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [search,setSearch] = useState("");
  const filter = search.toLocaleLowerCase("es").trim();
  const list = candidacies.filter(c => c.officialName.toLocaleLowerCase("es").includes(filter));
  const chosen = candidacies.find(c => c.id === selected);
  return <section className={styles.shell} aria-labelledby="ballot-preview-title">
    <div className={styles.head}>
      <div>
        <span className={styles.kicker}>EL PUEBLO OPINA · PAPELETA DE CONSULTA</span>
        <h2 id="ballot-preview-title">¿Qué opción elegirías en {provinceName}?</h2>
        <p>Explora las candidaturas proclamadas. Esta pantalla es una demostración: no almacena ni envía tu respuesta.</p>
      </div>
      <span className={styles.closed}>Sondeo todavía cerrado</span>
    </div>
    <label className={styles.fieldLabel} htmlFor="ballot-search">Buscar candidatura por nombre</label>
    <input className={styles.search} id="ballot-search" type="search" value={search} placeholder="Buscar en la papeleta…" onChange={e=>setSearch(e.target.value)}/>
    <div className={styles.options} role="group" aria-label={`Candidaturas de ${provinceName}`}>
      {list.map(c=>{
        const logo=logoForCandidacy(c.officialName);
        return <button className={`${styles.option} ${selected===c.id?styles.active:""}`} type="button" key={c.id}
          aria-pressed={selected===c.id} onClick={()=>{setSelected(c.id);setConfirmed(false);}}>
          <span className={styles.logo}>{logo?<img width="56" height="42" src={logo.path} alt="" loading="lazy"/>:<span aria-hidden="true">—</span>}</span>
          <span className={styles.name}>{c.officialName}</span>
          <span className={styles.marker} aria-hidden="true">{selected===c.id?"✓":"○"}</span>
        </button>;
      })}
    </div>
    {list.length===0 && <p role="status">No se encuentran candidaturas con ese texto.</p>}
    <div className={styles.confirm}>
      {chosen?<p><strong>Selección de prueba:</strong> {chosen.officialName}</p>:<p>Selecciona una candidatura para ver cómo será la confirmación.</p>}
      <button type="button" disabled={!chosen} onClick={()=>setConfirmed(true)}>
        Revisar mi selección de prueba
      </button>
      {confirmed && chosen && <p role="status" className={styles.ack}>Has seleccionado «{chosen.officialName}» en esta demostración. No se ha registrado ningún voto.</p>}
    </div>
    <p className={styles.legal}><strong>No es una elección oficial.</strong> Sondeo voluntario no científico ni representativo. Antes de habilitar la participación se publicarán las condiciones y garantías de privacidad.</p>
  </section>;
}

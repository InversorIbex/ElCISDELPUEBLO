"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./ProvinceQuickPicker.module.css";

type ProvinceOption = { code: string; name: string };
export function ProvinceQuickPicker({ provinces }: { provinces: ProvinceOption[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>("");
  const options = useMemo(() => provinces
    .filter((p) => p.name.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
      query.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    ))
    .sort((a,b) => a.name.localeCompare(b.name, "es")), [provinces,query]);
  const province = provinces.find((p) => p.code === selected);
  return (
    <section className={styles.panel} aria-labelledby="quick-province-title">
      <div className={styles.top}>
        <div>
          <span className={styles.eyebrow}>EL PUEBLO OPINA · ELECCIONES GENERALES 2026</span>
          <h2 id="quick-province-title">Tu circunscripción. Tu opinión.</h2>
          <p>Selecciona una de las 52 circunscripciones para conocer sus candidaturas oficiales. Sin geolocalización.</p>
        </div>
        <span className={styles.count}>52 circunscripciones</span>
      </div>
      <label className={styles.label} htmlFor="province-search">Buscar circunscripción</label>
      <input id="province-search" className={styles.input} type="search" value={query}
        onChange={(event)=> {setQuery(event.target.value); setSelected("");}}
        placeholder="Escribe Lugo, Madrid, Ceuta…" autoComplete="off" />
      <label className={styles.label} htmlFor="province-direct">Provincia o ciudad autónoma</label>
      <select id="province-direct" className={styles.input} value={selected} onChange={(event)=>setSelected(event.target.value)}>
        <option value="">Elige tu circunscripción</option>
        {options.map(p=><option key={p.code} value={p.code}>{p.name}</option>)}
      </select>
      {options.length === 0 && <p role="status">No hay circunscripciones que coincidan con la búsqueda.</p>}
      {province ? (
        <Link className={styles.cta} href={`/participar?provincia=${encodeURIComponent(province.code)}#papeleta`}>
          Ver candidaturas de {province.name} →
        </Link>
      ) : (
        <p className={styles.hint}>Puedes consultar todas las candidaturas. La recogida de votos todavía no está abierta.</p>
      )}
      <p className={styles.disclaimer}>Sondeo abierto voluntario, no científico ni representativo. No es una consulta electoral oficial.</p>
    </section>
  );
}
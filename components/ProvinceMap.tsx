"use client";
import { useEffect, useState } from "react";
import styles from "./ProvinceMap.module.css";

type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
type Feature = { code: string; name: string; geometry: Geometry };
type MapResponse = { features?: Feature[] };
type Province = { code: string; name: string };
const x = (lon: number) => 75 + ((lon + 9.7) / 14.2) * 625;
const y = (lat: number) => 430 - ((lat - 35.7) / 8.6) * 365;
function xy(lon: number, lat: number): [number, number] {
  if (lon < -12) return [45 + ((lon + 18.4) / 5.3) * 200, 515 - ((lat - 27.4) / 2.4) * 85];
  return [x(lon), y(lat)];
}
function draw(geo: Geometry): string {
  const polygons: number[][][][] = geo.type === "Polygon"
    ? [geo.coordinates as number[][][]] : geo.coordinates as number[][][][];
  return polygons.map(p => p.map(ring => ring.map(([lon,lat],idx) => {
    const [px,py] = xy(lon,lat);
    return `${idx===0?"M":"L"}${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(" ")+"Z").join(" ")).join(" ");
}
export function ProvinceMap({ provinces }: { provinces: Province[] }) {
  const [features,setFeatures] = useState<Feature[]>([]);
  const [failed,setFailed] = useState(false);
  const [active,setActive] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/province-geometry", { signal: controller.signal })
      .then(res => { if(!res.ok) throw Error("unavailable"); return res.json() as Promise<MapResponse>; })
      .then(data => {
        if(!data.features || data.features.filter(f => f.code !== "51" && f.code !== "52").length !== 50)
          throw Error("incomplete");
        setFeatures(data.features);
      })
      .catch(() => { if(!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  const names = new Map(provinces.map(p=>[p.code,p.name]));
  return <section className={styles.shell} aria-labelledby="province-map-title">
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>MAPA ELECTORAL · 52 CIRCUNSCRIPCIONES</span>
        <h2 id="province-map-title">Elige tu provincia en el mapa.</h2>
        <p>Selecciona una circunscripción y consulta sus candidaturas oficiales. Sin geolocalización.</p></div>
      <span className={styles.status}>{features.length ? "Mapa provincial disponible" :
        failed ? "Usa el selector de provincias" : "Cargando límites oficiales…"}</span>
    </div>
    {features.length>0 ? <div className={styles.canvas}>
      <svg viewBox="0 0 760 580" role="group" aria-label="Mapa navegable de provincias de España. Las ciudades autónomas están en la parte inferior.">
        <rect x="0" y="0" width="760" height="580" rx="18" fill="#faf9f7"/>
        <rect x="25" y="434" width="247" height="118" rx="12" fill="#f3f1f7" stroke="#e0dbea"/>
        <text x="37" y="451" className={styles.label}>CANARIAS</text>
        {features.filter(f=>f.code!=="51" && f.code!=="52").map((f,i)=><a key={f.code}
          href={`/participar?provincia=${encodeURIComponent(f.code)}#papeleta`}
          aria-label={`Ver candidaturas de ${names.get(f.code) || f.name}`}
          onMouseEnter={()=>setActive(f.code)} onMouseLeave={()=>setActive("")}
          onFocus={()=>setActive(f.code)} onBlur={()=>setActive("")}>
          <path d={draw(f.geometry)} fill={active===f.code?"#c1b1e2":i%3===0?"#e9e3f4":i%3===1?"#dcece6":"#e3ecf2"}
            stroke="#fff" strokeWidth="1.1" fillRule="evenodd" className={styles.shape}/>
          <title>{names.get(f.code) || f.name}</title>
        </a>)}
        {(["51","52"] as const).map((code,i)=><a key={code}
          href={`/participar?provincia=${code}#papeleta`}
          aria-label={`Ver candidaturas de ${names.get(code)}`}>
          <rect x={308+i*205} y="470" width="176" height="54" rx="12" fill="#e9e3f4" stroke="#a99cc7"/>
          <text x={396+i*205} y="502" textAnchor="middle" className={styles.city}>{names.get(code)}</text>
        </a>)}
        <text x="36" y="572" className={styles.label}>Geometría simplificada para consulta · No sirve para delimitaciones jurídicas</text>
      </svg>
      <div aria-live="polite" className={styles.selection}>{active ? `Seleccionado: ${names.get(active)} · Abrir candidaturas ↗` :
        "Pulsa una provincia o utiliza el buscador de la parte superior."}</div>
    </div> : <div className={styles.fallback} role="status">
      {failed ? "No se pudieron cargar los límites provinciales oficiales. Puedes acceder igualmente a las 52 circunscripciones con el buscador." :
        "Cargando el mapa provincial. El selector de circunscripciones funciona independientemente."}
    </div>}
    <p className={styles.credit}>Cartografía de referencia: <a href="https://centrodedescargas.cnig.es/CentroDescargas/limites-municipales-provinciales-autonomicos">IGN/CNIG</a>. Obra derivada de datos administrativos, CC BY 4.0 ign.es. Datos visualizados sin resultados electorales ni votos.</p>
  </section>;
}

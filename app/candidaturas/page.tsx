import Link from "next/link";
import { CandidacyList } from "@/components/CandidacyList";
import {
  candidaciesForProvince,
  candidacyInfo,
  candidacies,
} from "@/lib/candidacies/registry";
import { logoForCandidacy, logoInfo } from "@/lib/candidacies/logos";
import {
  provinces,
  provinceByCode,
  displayName,
  provincePath,
} from "@/lib/territories";
export const metadata = {
  title: "Candidaturas y listas electorales al Congreso 2026 por provincia",
  description: "Todas las candidaturas proclamadas en el BOE para las elecciones generales del 29 de noviembre de 2026, provincia a provincia, con su nombre exacto en la papeleta y logos verificados.",
  alternates: { canonical: "/candidaturas" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ provincia?: string }>;
}) {
  const params = await searchParams;
  const province =
    typeof params.provincia === "string"
      ? provinceByCode.get(params.provincia)
      : undefined;
  const list = province ? candidaciesForProvince(province.code) : [];
  const covered = candidacies.filter((c) =>
    logoForCandidacy(c.officialName),
  ).length;
  return (
    <section className="page-section candidacy-page">
      <div className="eyebrow">ELECCIONES GENERALES · 29 NOVIEMBRE 2026</div>
      <h1>
        Quién se presenta
        <br />
        en tu circunscripción.
      </h1>
      <p className="lead">
        Consulta las candidaturas proclamadas al Congreso. Cada territorio tiene
        sus propias listas; una inscripción en otra provincia no la convierte en
        una opción disponible aquí.
      </p>
      <div className="catalog-ribbon">
        <span>
          <strong>{candidacyInfo.total}</strong> candidaturas proclamadas
        </span>
        <span>
          <strong>52</strong> circunscripciones
        </span>
        <span>
          <strong>{candidacyInfo.excluded}</strong> no proclamadas excluidas
        </span>
        <span>BOE · revisión a 08/11/2026</span>
      </div>
      <div className="ballot-consultation-note">
        <span className="pill">CONSULTA DE CANDIDATURAS</span>
        <p>
          La recogida de opiniones todavía está cerrada. Ver estas listas no
          registra una preferencia de voto.{" "}
          <Link href="/privacidad">Estado de las garantías →</Link>
        </p>
      </div>
      <form className="constituency-form" method="get" action="/candidaturas">
        <div>
          <label htmlFor="candidate-province">Elige tu circunscripción</label>
          <select
            id="candidate-province"
            name="provincia"
            defaultValue={province?.code ?? ""}
            required
          >
            <option value="" disabled>
              Selecciona provincia o ciudad autónoma
            </option>
            {[...provinces]
              .sort((a, b) =>
                displayName(a.name).localeCompare(displayName(b.name), "es"),
              )
              .map((p) => (
                <option key={p.code} value={p.code}>
                  {displayName(p.name)}
                </option>
              ))}
          </select>
        </div>
        <button type="submit" className="button">
          Mostrar candidaturas →
        </button>
      </form>
      {params.provincia && !province && (
        <p role="alert" className="form-error">
          El código provincial no es válido. Selecciona una circunscripción del
          catálogo.
        </p>
      )}
      {province ? (
        <>
          <div className="directory-heading">
            <div>
              <div className="eyebrow">CIRCUNSCRIPCIÓN {province.code}</div>
              <h2>{displayName(province.name)}</h2>
              <p>
                {list.length} candidaturas proclamadas · orden de la publicación
                oficial
              </p>
            </div>
            <Link className="text-link" href={provincePath(province)}>
              Ficha territorial ↗
            </Link>
          </div>
          <div className="actions">
            <Link
              className="secondary"
              href={`/participar?provincia=${province.code}#papeleta`}
            >
              Abrir mi circunscripción →
            </Link>
            <Link
              className="secondary"
              href={`/resultados?provincia=${province.code}`}
            >
              Ver resultados y referencia histórica →
            </Link>
          </div>
          <CandidacyList list={list} />
        </>
      ) : (
        <div className="candidacy-start">
          <span aria-hidden="true">52</span>
          <h2>Empieza por el territorio.</h2>
          <p>
            La provincia determina qué candidaturas podrán formar parte de tu
            sondeo. El catálogo incluye Ceuta y Melilla.
          </p>
          <Link className="text-link" href="/participar">
            Elegir mi zona en el mapa →
          </Link>
        </div>
      )}
      <details className="logo-transparency">
        <summary>
          Sobre las fuentes y los logos ({covered} de {candidacyInfo.total}{" "}
          candidaturas con imagen verificada)
        </summary>
        <p>
          Se han incorporado {logoInfo.totalAssets} archivos identificativos
          publicados en webs oficiales de las formaciones. Se conservan sin
          cambios visuales, con fuente y huella. No se ha verificado todavía el
          símbolo electoral específico de cada papeleta o coalición.
        </p>
        <p>
          Donde falta un archivo contrastado se indica “Logo pendiente de
          verificación”. No se crea una imagen ni se copia el símbolo de otro
          partido para rellenar ese espacio. El portal oficial de papeletas no
          ha permitido la descarga desde este entorno (HTTP 403); las imágenes
          ausentes siguen pendientes.
        </p>
        <p>
          Las denominaciones y su disponibilidad territorial proceden de las{" "}
          <a href={candidacyInfo.sources[0].url}>
            candidaturas proclamadas en el BOE
          </a>{" "}
          y de la{" "}
          <a href={candidacyInfo.sources[1].url}>
            corrección del 7 de noviembre
          </a>
          . No se importan nombres de personas ni candidaturas del Senado como
          opciones del Congreso. Se revisarán cambios oficiales posteriores
          antes de abrir cualquier campaña.
        </p>
      </details>
    </section>
  );
}

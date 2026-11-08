import {
  catalogInfo,
  municipalities,
  provinces,
  communities,
} from "@/lib/territories";
export const metadata = { title: "Fuentes y trazabilidad del catálogo" };
export default function Page() {
  return (
    <article className="page-section">
      <div className="eyebrow">FUENTES Y TRAZABILIDAD</div>
      <h1>
        Los datos tienen
        <br />
        un punto de partida.
      </h1>
      <p className="lead">
        El territorio procede de fuentes oficiales. Las opiniones, cuando se
        abra la participación, serán voluntarias y no representativas.
      </p>
      <div className="catalog-ribbon">
        <span>
          <strong>
            {municipalities.length.toLocaleString("es-ES", {
              useGrouping: "always",
            })}
          </strong>{" "}
          municipios
        </span>
        <span>
          <strong>{provinces.length}</strong> códigos provinciales
        </span>
        <span>
          <strong>{communities.length}</strong> comunidades y ciudades autónomas
        </span>
      </div>
      <div className="prose">
        <h2>Catálogo territorial INE</h2>
        <p>
          Relación a <strong>1 de enero de 2026</strong>. Se ha contrastado el
          número de municipios de cada provincia con la tabla de recuentos del
          INE. Los códigos conservan sus ceros iniciales y cada municipio
          pertenece a una provincia y a una comunidad o ciudad autónoma.
        </p>
        <p>
          No es una sincronización continua del Registro de Entidades Locales.
          Las modificaciones posteriores a esa fecha requieren una nueva
          importación revisada. Las denominaciones oficiales se conservan; los
          artículos pueden reorganizarse para facilitar su lectura.
        </p>
        <p>
          <a href="https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177031&menu=ultiDatos&idp=1254734710990">
            Consultar la operación estadística del INE ↗
          </a>
        </p>
        <h2>Archivos de origen</h2>
        <p>
          Las huellas SHA-256 permiten detectar cambios en los archivos
          descargados. No son por sí solas una firma de autenticidad del INE.
        </p>
        {catalogInfo.sources.map((s, i) => (
          <div className="source-document" key={s.url}>
            <span className="eyebrow">
              FUENTE {String(i + 1).padStart(2, "0")}
            </span>
            <h3>
              <a href={s.url}>
                {
                  [
                    "Municipios por provincia con sus códigos",
                    "Provincias por comunidades autónomas",
                    "Recuentos de municipios por provincia y comunidad",
                  ][i]
                }{" "}
                ↗
              </a>
            </h3>
            <p className="hash-label">SHA-256</p>
            <code>{s.sha256}</code>
          </div>
        ))}
        <h2>Reutilización y atribución</h2>
        <p>
          Fuente: sitio web del INE, www.ine.es. Relación a 1 de enero de 2026.
          Elaboración del catálogo y buscador: El CIS del Pueblo. El INE no
          participa, patrocina ni apoya este proyecto.
        </p>
        <p>
          El{" "}
          <a href="https://www.ine.es/dyngs/AYU/index.htm?cid=125">
            aviso legal del INE
          </a>{" "}
          establece, con las excepciones indicadas en él, la licencia general CC
          BY 4.0 para su información estadística. Se respeta la atribución y se
          identifican las transformaciones. La cartografía autonómica utiliza
          límites del IGN bajo sus propias condiciones.
        </p>
        <h2>Geometrías administrativas del IGN</h2>
        <p>
          La vista nacional deriva del{" "}
          <a href="https://www.ign.es/wfs-inspire/unidades-administrativas?service=WFS&amp;request=GetCapabilities&amp;version=2.0.0">
            servicio WFS INSPIRE de unidades administrativas del IGN
          </a>
          . Se ha descargado y comprobado una geometría por comunidad o ciudad
          autónoma, relacionada con los códigos INE del catálogo.
        </p>
        <p>
          Obra derivada: simplificación para una vista nacional y composición de
          recuadros con escala propia para Canarias, Ceuta y Melilla. No es una
          cartografía de medición o delimitación jurídica. Atribución:{" "}
          <a href="https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf">
            CC BY 4.0 ign.es
          </a>
          . Las capas provinciales y municipales están pendientes.
        </p>
        <h2>Convocatoria y escaños del Congreso</h2>
        <p>
          La convocatoria del 29 de noviembre de 2026 y el reparto de diputados
          proceden del{" "}
          <a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20742">
            Real Decreto 806/2026, anexo
          </a>
          . Se han validado las 52 circunscripciones y el total de 350 escaños.
          Las 534 candidaturas proclamadas están importadas desde el BOE del 3
          de noviembre, con su corrección del 7 de noviembre.
        </p>
        <p>
          Reglas del simulador:{" "}
          <a href="https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672#acientosesentaytres">
            LOREG, artículo 163
          </a>
          . El simulador utiliza alternativas hipotéticas introducidas
          manualmente, no partidos proclamados ni opiniones recogidas.
        </p>
        <h2>Candidaturas, logos y comparación histórica</h2>
        <p>
          <a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103">
            Proclamación del Congreso y Senado
          </a>{" "}
          y{" "}
          <a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23383">
            corrección posterior
          </a>
          . Solo se importan opciones del Congreso; 21 no proclamadas quedan
          excluidas.{" "}
          <a href="/candidaturas">
            Consultar catálogo provincial y cobertura de logos
          </a>
          . Los logos proceden de webs oficiales de las formaciones, con enlaces
          y huellas; no se asegura su equivalencia al símbolo registrado en cada
          papeleta.
        </p>
        <p>
          La comparación del hemiciclo utiliza{" "}
          <a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907">
            los resultados oficiales de 2023 publicados por la JEC
          </a>
          , por candidaturas y circunscripciones. No representa la composición
          de grupos al final de la legislatura. Las hipótesis manuales se
          identifican por separado.
        </p>
        <h2>Alias para encontrar un lugar</h2>
        <p>
          La búsqueda ignora acentos y diferencias de mayúsculas y reconoce los
          componentes de las denominaciones bilingües oficiales. También
          contiene un pequeño diccionario editorial de variantes comunes, como
          Orense, Gerona o Palma de Mallorca. Estos alias son ayudas de búsqueda
          y no sustituyen el nombre ni el código oficial. No se afirma cobertura
          exhaustiva de todos los nombres históricos o cooficiales.
        </p>
      </div>
    </article>
  );
}

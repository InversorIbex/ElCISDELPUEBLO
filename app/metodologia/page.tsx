export const metadata = { title: "Metodología y transparencia" };
export default function Page() {
  return (
    <article className="page-section">
      <div className="eyebrow">METODOLOGÍA Y TRANSPARENCIA</div>
      <h1>La confianza exige contexto.</h1>
      <p className="lead">
        SONDEO ABIERTO DE INTERNAUTAS — MUESTRA NO REPRESENTATIVA
      </p>
      <div className="prose">
        <h2>Qué es este proyecto</h2>
        <p>
          Un observatorio independiente en desarrollo. La identidad formal de la
          entidad responsable y la revisión de los documentos jurídicos están
          pendientes. El contacto público previsto es letrixagame@gmail.com. Por
          este motivo y por los controles aún pendientes, no recogemos
          respuestas políticas.
        </p>
        <h2>Qué significa un sondeo abierto</h2>
        <p>
          Participa quien decide hacerlo. No hay selección aleatoria ni
          corrección automática del sesgo de participación. Las respuestas no
          representan necesariamente a España y no son comparables sin más con
          encuestas científicas. No se calcularán intervalos de confianza
          propios de muestras aleatorias.
        </p>
        <h2>Circunscripción declarada, nunca inferida</h2>
        <p>
          En el sondeo del Congreso se elegirá manualmente una de las 52
          circunscripciones. No se necesita guardar el municipio. Será una
          declaración del participante, no una residencia verificada. No se usa
          GPS, geolocalización por IP ni ubicación inferida.
        </p>
        <h2>Privacidad y control de tu respuesta</h2>
        <p>
          El diseño prevé credenciales privadas específicas por sondeo para
          sustituir o retirar una respuesta. No habrá una cuenta global que
          conecte opiniones entre preguntas. Es un sistema seudónimo y no se
          promete anonimato absoluto. Una credencial aleatoria en el navegador
          permitirá recuperar el control de esa respuesta; no es un
          identificador físico del dispositivo. Borrar sus datos o cambiar de
          navegador puede impedir reconocerla.
        </p>
        <p>
          Antes de abrir se requiere revisión jurídica especializada de los
          artículos 6 y 9 del RGPD, evaluación de riesgos, decisión sobre
          evaluación de impacto, plazos de conservación e información para
          ejercer derechos. La consulta de resultados no exigirá entregar
          opiniones.
        </p>
        <h2>Cómo se calcularán los porcentajes</h2>
        <p>
          Los resultados de candidaturas indicarán expresamente el total de
          respuestas a candidaturas usado como denominador. Blanco, nulo,
          abstención, indecisión y preferencia de no responder aparecerán por
          separado. Las simulaciones usarán el denominador legal de votos
          válidos, incluido el blanco y excluido el nulo. Los denominadores no
          se intercambiarán.
        </p>
        <h2>Publicación territorial segura</h2>
        <p>
          Se propone un umbral inicial de 50 respuestas por unidad publicada,
          pendiente de evaluación. No basta por sí solo para garantizar
          anonimato. Será necesario revisar supresiones complementarias,
          filtros, diferencias entre totales y publicaciones sucesivas. La API
          aplicará las mismas restricciones. La privacidad tiene prioridad sobre
          la frecuencia de actualización.
        </p>
        <h2>Antifraude sin promesas imposibles</h2>
        <p>
          Se prevén tokens de un solo uso, límites de frecuencia y verificación
          de automatización en servidor. No se empleará fingerprinting invasivo
          ni se guardarán IP junto a preferencias políticas. Sin identificación
          fiable no puede garantizarse una respuesta por persona. Las
          exclusiones necesitarán reglas públicas y auditables.
        </p>
        <h2>Tendencias y simulaciones</h2>
        <p>
          Las series distinguirán distribución de respuestas activas e
          intervalos de recepción. No existe un panel verificable. Una
          corrección no contará como nueva persona. La simulación manual ya
          permite explorar cifras hipotéticas por circunscripción con el reparto
          del RD 806/2026 y las reglas del artículo 163 LOREG. Se pueden sumar
          escenarios provinciales manuales, ver un hemiciclo y guardar puntos de
          escenarios en memoria. La referencia histórica muestra los resultados
          oficiales de 2023. No existe todavía una estimación basada en
          respuestas reales ni una serie temporal publicada.
        </p>
        <h2>Fuentes y estado de verificación</h2>
        <p>
          La convocatoria del 29 de noviembre de 2026 y el reparto de 350
          escaños entre 52 circunscripciones se han comprobado en el{" "}
          <a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20742">
            Real Decreto 806/2026
          </a>
          . Las 534 candidaturas proclamadas del Congreso y la corrección del 7
          de noviembre están importadas por circunscripción; los logos tienen
          cobertura parcial. La cartografía autonómica procede del IGN con
          atribución CC BY 4.0. Verificar una convocatoria no abre un sondeo ni
          valida sus papeletas. El catálogo municipal del INE a 1 de enero de
          2026 ya está importado: 8.132 municipios, con contraste de recuentos
          provinciales y huellas SHA-256 de los archivos fuente. No se presenta
          como actualización en tiempo real del Registro de Entidades Locales.
        </p>
        <p>
          Fuentes previstas: <a href="https://www.ine.es/">INE</a>,{" "}
          <a href="https://www.boe.es/">BOE</a>,{" "}
          <a href="https://www.juntaelectoralcentral.es/">
            Junta Electoral Central
          </a>{" "}
          y <a href="https://centrodedescargas.cnig.es/">CNIG</a>. Estos enlaces
          identifican organismos; no certifican una importación ya realizada.
        </p>
        <h2>Independencia</h2>
        <p>
          Esta plataforma es independiente y no está vinculada al Centro de
          Investigaciones Sociológicas, al Gobierno de España ni a ningún
          organismo electoral. Sus resultados provienen de la participación
          voluntaria de internautas y no constituyen una muestra
          estadísticamente representativa.
        </p>
      </div>
    </article>
  );
}

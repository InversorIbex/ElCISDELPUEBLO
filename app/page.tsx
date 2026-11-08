import { CommunityMap } from "@/components/CommunityMap";
import mapData from "@/data/cartography/communities-svg.json";
import { TerritorySelector } from "@/components/TerritorySelector";
import { communities, provinces, municipalities } from "@/lib/territories";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">
          <span className="dot" /> OBSERVATORIO CIUDADANO INDEPENDIENTE
        </div>
        <div className="hero-grid">
          <div>
            <h1>
              La opinión de quienes
              <br />
              deciden <em>participar.</em>
            </h1>
            <p className="hero-question">
              ¿A quién votarías si hoy fueran
              <br />
              las elecciones generales?
            </p>
            <p className="hero-copy">
              Explora las candidaturas de tu circunscripción y descubre cómo se
              convierten los votos en escaños. Estamos preparando el sondeo
              ciudadano; la participación todavía no está abierta.
            </p>
            <div className="actions">
              <Link className="button" href="/participar">
                Ver mi circunscripción <span>↗</span>
              </Link>
              <Link className="secondary" href="/simulador">
                Explorar el hemiciclo ↗
              </Link>
            </div>
            <p className="privacy-note">
              ◈ Tú eliges la circunscripción. Sin geolocalización.
            </p>
          </div>
          <aside className="hero-card">
            <div className="card-top">
              <span>LA VOZ DEL TERRITORIO</span>
              <span>01 / ESPAÑA</span>
            </div>
            <div className="editorial-art" aria-hidden="true">
              <div className="orbit o1" />
              <div className="orbit o2" />
              <div className="orbit o3" />
              <div className="art-cross">+</div>
              <span className="art-word">
                Cada voz.
                <br />
                Un lugar.
              </span>
              <div className="art-dots">
                •••••
                <br />
                •••••
                <br />
                •••••
              </div>
            </div>
            <div className="card-bottom">
              <span>
                Una mirada compartida,
                <br />
                <strong>con los límites a la vista.</strong>
              </span>
              <span className="circle-arrow">↗</span>
            </div>
          </aside>
        </div>
      </section>
      <div className="notice">
        <span aria-hidden="true">ⓘ</span>
        <p>
          <strong>
            SONDEO ABIERTO DE INTERNAUTAS — MUESTRA NO REPRESENTATIVA
          </strong>
          <br />
          Las respuestas voluntarias no representan necesariamente a la
          población española.
        </p>
        <Link href="/metodologia">Cómo leer los datos ↗</Link>
      </div>
      <section className="stats" aria-label="Estado de los datos">
        <div>
          <span>Circunscripciones</span>
          <strong>52</strong>
          <small>Elección manual, sin ubicación inferida</small>
        </div>
        <div>
          <span>Candidaturas proclamadas</span>
          <strong>534</strong>
          <small>BOE · Revisión a 08/11/2026</small>
        </div>
        <div>
          <span>Congreso de los Diputados</span>
          <strong>350</strong>
          <small>Simulación manual por circunscripción</small>
        </div>
        <div>
          <span>Sondeos abiertos</span>
          <strong>0</strong>
          <small>Preparando una participación segura</small>
        </div>
      </section>
      <section className="section">
        <CommunityMap
          features={mapData.features.map((f) => ({
            ...f,
            href: `/participar?comunidad=${f.code}#circunscripcion`,
          }))}
          selectionMode
        />
      </section>
      <section
        className="section launch-tools"
        aria-labelledby="herramientas-title"
      >
        <div className="eyebrow">DISPONIBLE HOY</div>
        <h2 id="herramientas-title">Explora. Comprueba. Entiende.</h2>
        <div className="launch-grid">
          <Link href="/candidaturas" className="launch-card">
            <span>01 / CANDIDATURAS</span>
            <h3>Tu circunscripción, sus opciones.</h3>
            <p>
              Nombres oficiales, orden de proclamación y fuentes. Todas las
              opciones aparecen, tengan o no logo verificado.
            </p>
            <strong>Consultar candidaturas ↗</strong>
          </Link>
          <Link href="/simulador" className="launch-card">
            <span>02 / HEMICICLO</span>
            <h3>Construye un escenario.</h3>
            <p>
              Calcula cada provincia, reúne hasta 350 escaños y compara la
              estructura con el resultado oficial de 2023.
            </p>
            <strong>Abrir simulador ↗</strong>
          </Link>
          <Link href="/ayuda" className="launch-card">
            <span>03 / CÓMO FUNCIONA</span>
            <h3>Las respuestas, claras.</h3>
            <p>
              Qué puedes consultar hoy, cómo se elegirá la circunscripción y qué
              significará cambiar una respuesta.
            </p>
            <strong>Preguntas frecuentes ↗</strong>
          </Link>
        </div>
      </section>
      <section className="section" id="resultados">
        <div className="section-head">
          <div>
            <div className="eyebrow">01 / SONDEO ELECTORAL</div>
            <h2>Una mirada a las respuestas.</h2>
            <p>
              Distribución nacional de las participaciones válidas publicables.
            </p>
          </div>
          <span className="pill">España · Sin datos publicados</span>
        </div>
        <div className="results-grid">
          <div className="panel">
            <div className="panel-head">
              <h3>Preferencias electorales</h3>
              <span>Ámbito nacional</span>
            </div>
            <EmptyState
              title="Los datos empiezan con la confianza."
              text="Todavía no hay resultados publicados. El catálogo de candidaturas ya se puede consultar. Los porcentajes del sondeo aparecerán cuando exista una publicación segura."
            />
          </div>
          <aside className="ink-panel">
            <div className="eyebrow">ANTES DE PARTICIPAR</div>
            <h3>
              Una opinión.
              <br />
              Una decisión
              <br />
              <em>informada.</em>
            </h3>
            <p>
              Conoce qué recogemos, cómo protegemos las respuestas y qué pueden
              decir los resultados.
            </p>
            <Link href="/metodologia">
              Nuestro compromiso de transparencia <span>↗</span>
            </Link>
          </aside>
        </div>
      </section>
      <section className="section territory" id="territorio">
        <div>
          <div className="eyebrow">02 / EL TERRITORIO IMPORTA</div>
          <h2>
            España, desde
            <br />
            cada municipio.
          </h2>
          <p>
            Explora 8.132 municipios del catálogo oficial INE, sus provincias y
            comunidades. Es un directorio de consulta: el sondeo del Congreso
            solo necesitará elegir circunscripción, sin guardar tu municipio.
          </p>
          <Link className="secondary" href="/mapa">
            Explorar el territorio →
          </Link>
          <div className="catalog-proof">
            <strong>
              {municipalities.length.toLocaleString("es-ES", {
                useGrouping: "always",
              })}
            </strong>
            <span>
              municipios con nombre y código oficial
              <br />
              Fuente: INE · 01/01/2026
            </span>
          </div>
        </div>
        <TerritorySelector
          communities={communities}
          provinces={provinces}
          compact
        />
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">03 / MÁS ALLÁ DEL VOTO</div>
            <h2>Las preguntas también cuentan.</h2>
          </div>
          <Link className="text-link" href="/preguntas">
            Preguntas del pueblo ↗
          </Link>
        </div>
        <div className="question-card">
          <span className="pill">Vista previa editorial · No abierta</span>
          <h3>
            ¿Qué problema debería recibir
            <br />
            mayor prioridad presupuestaria?
          </h3>
          <p>
            Vivienda, sanidad, empleo, educación… Un futuro espacio de preguntas
            neutrales e independientes del sondeo electoral.
          </p>
          <Link className="secondary" href="/preguntas">
            Ver cómo funcionará →
          </Link>
        </div>
      </section>
      <section className="section simulation-promo">
        <div>
          <div className="eyebrow">04 / ENTENDER EL REPARTO</div>
          <h2>
            De los votos
            <br />a los escaños.
          </h2>
          <p>
            Explora un escenario hipotético con las reglas del Congreso y el
            reparto oficial por circunscripción. El cálculo es local y no recoge
            tu opinión.
          </p>
          <Link className="button" href="/simulador">
            Abrir simulador manual ↗
          </Link>
        </div>
        <aside>
          <span className="simulation-sigma" aria-hidden="true">
            Σ
          </span>
          <div>
            <strong>52</strong>
            <span>circunscripciones</span>
          </div>
          <div>
            <strong>350</strong>
            <span>escaños · RD 806/2026</span>
          </div>
          <p>
            Matemática electoral.
            <br />
            No una predicción.
          </p>
        </aside>
      </section>
      <section className="closing">
        <div className="eyebrow">
          ABIERTOS TAMBIÉN CON NUESTRAS LIMITACIONES
        </div>
        <h2>
          Escuchar mejor empieza
          <br />
          por explicar mejor.
        </h2>
        <Link href="/metodologia">Lee nuestra metodología ↗</Link>
      </section>
    </>
  );
}

import Link from "next/link";
import { launchRequirements } from "@/lib/server/privacy-gates";
import { legalContact } from "@/lib/legal";
export const metadata = { title: "Privacidad y control de tu respuesta" };
export default function Page() {
  return (
    <article className="page-section">
      <div className="eyebrow">PRIVACIDAD DESDE EL PRINCIPIO</div>
      <h1>
        Tu opinión merece
        <br />
        estar bajo tu control.
      </h1>
      <p className="lead">
        Consultar es libre. Compartir una opinión será siempre una decisión
        informada y específica para cada sondeo.
      </p>
      <div className="privacy-banner">
        <span className="pill">RECOGIDA CERRADA</span>
        <h2>Hoy no recogemos opiniones políticas.</h2>
        <p>
          Las pruebas del motor utilizan únicamente opciones sintéticas en un
          entorno aislado. Superar esas pruebas no sustituye la revisión
          jurídica ni habilita la participación pública.
        </p>
      </div>
      <div className="privacy-principles">
        <div>
          <span>01 / DECIDES EL LUGAR</span>
          <h3>Sin geolocalización</h3>
          <p>
            La circunscripción del Congreso se elige manualmente; no se necesita
            el municipio. No usamos GPS ni localización por IP y no verificamos
            residencia.
          </p>
        </div>
        <div>
          <span>02 / CADA SONDEO, SEPARADO</span>
          <h3>Sin un perfil político</h3>
          <p>
            El diseño usa credenciales específicas para cada campaña. No una
            cuenta que reúna tus opiniones.
          </p>
        </div>
        <div>
          <span>03 / PUEDES CAMBIAR</span>
          <h3>Corrección y retirada</h3>
          <p>
            La credencial privada permitirá sustituir o retirar una respuesta.
            No se publicará tu respuesta individual.
          </p>
        </div>
      </div>
      <div className="prose">
        <h2>Una credencial, no una promesa de anonimato absoluto</h2>
        <p>
          El motor de prueba separa los hashes de las credenciales de las
          respuestas cifradas. Existe un enlace técnico necesario para corregir
          o retirar; por eso hablamos de seudonimización. La separación y el
          cifrado reducen riesgos, pero no eliminan todos los posibles enlaces.
        </p>
        <p>
          Sin identificación fiable tampoco podemos garantizar una respuesta por
          persona. No pediremos DNI ni añadiremos fingerprinting invasivo para
          simular esa garantía.
        </p>
        <h2>Antes de abrir la participación</h2>
        <p>
          Estas condiciones siguen pendientes de cierre. Ningún resultado de
          pruebas técnicas las marca automáticamente como resueltas.
        </p>
      </div>
      <ol className="launch-checklist">
        {launchRequirements.map((r) => (
          <li key={r.id}>
            <span aria-hidden="true">○</span>
            <strong>{r.label}</strong>
            <span className="pill">Pendiente</span>
          </li>
        ))}
      </ol>
      <div className="prose">
        <h2>Cómo se te pedirá consentimiento</h2>
        <p>
          Si la revisión jurídica confirma esta base, habrá una decisión
          explícita, separada para cada finalidad y versión del sondeo. No se
          sustituirá por aceptar unas condiciones genéricas. Podrás consultar
          resultados sin consentir el tratamiento de opiniones.
        </p>
        <details className="privacy-draft">
          <summary>Ver el texto de trabajo, aún sin validez operativa</summary>
          <p>
            <strong>Borrador para revisión:</strong> consiento explícitamente el
            tratamiento de la respuesta de esta campaña y de la circunscripción
            que declaro, con el fin de producir estadísticas agregadas del
            sondeo. Entiendo que mi respuesta puede revelar opiniones políticas,
            que participar es voluntario y que puedo retirarla usando mi
            credencial.
          </p>
          <p>
            Este texto todavía debe completarse con responsable, bases
            jurídicas, conservación, destinatarios, riesgos, derechos y canales
            efectivos. No hay aquí una casilla de aceptación ni se registra
            consentimiento.
          </p>
        </details>
        <h2>Conservación y retirada</h2>
        <p>
          Los plazos definitivos deben aprobarse antes de abrir. La retirada
          mediante credencial está probada en el laboratorio y elimina la
          respuesta activa y su credencial. Aún deben validarse copias de
          seguridad, registros, publicaciones previas y los casos en los que se
          pierde la credencial. No prometemos localizar una respuesta sin un
          mecanismo que permita hacerlo de forma segura.
        </p>
        <h2>Contacto y responsable</h2>
        <p>
          Contacto público previsto:{" "}
          <a href={`mailto:${legalContact.email}`}>{legalContact.email}</a>. La
          identidad formal del responsable está pendiente de completar. El
          contacto facilitado no acredita una revisión jurídica del proyecto.
        </p>
        <p>
          Mientras no se abra la recogida no debes enviar opiniones,
          credenciales ni documentación sensible por correo. Este canal puede
          utilizarse para solicitar información sobre el proyecto.
        </p>
        <p>
          <Link href="/metodologia">
            Consulta también la metodología y las limitaciones del sondeo →
          </Link>
        </p>
      </div>
    </article>
  );
}

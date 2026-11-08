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
          <h3>Voto definitivo y derechos</h3>
          <p>
            El voto confirmado no podrá modificarse ni sustituirse desde la papeleta.
            Los derechos de protección de datos se gestionarán mediante el canal de privacidad y requieren un procedimiento verificable antes de abrir.
          </p>
        </div>
      </div>
      <div className="prose">
        <h2>Una credencial, no una promesa de anonimato absoluto</h2>
        <p>
          El servicio web de votación guarda la papeleta separada de los hashes de IP y navegador usados para limitar participaciones. Al no disponer de un vínculo directo con una identidad, no podemos localizar automáticamente una papeleta individual a partir de un nombre o correo. Estos mecanismos reducen riesgos, pero los datos antifraude siguen siendo seudonimizados.
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
            que participar es voluntario y que mi voto no se podrá editar desde la web.
            Entiendo que la retirada del consentimiento y los derechos del RGPD
            deben poder ejercerse por un procedimiento efectivo comunicado antes de participar.
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
          Para prevenir duplicados se prevé conservar por separado hashes de IP y navegador durante el día civil de Madrid, y los hashes de solicitudes hasta 48 horas, con un proceso de limpieza pendiente de activar y verificar. Los identificadores móviles antifraude y las respuestas requieren plazos de fin de campaña y retirada todavía pendientes. Los plazos definitivos deben aprobarse antes de abrir. La versión pública aún no dispone de un procedimiento comprobado para localizar y suprimir una papeleta individual tras retirar el consentimiento. Antes de recoger opiniones políticas deben definirse la retirada del consentimiento, la gestión de derechos, las copias de seguridad y las publicaciones agregadas. No prometemos identificar una papeleta si técnicamente no es posible.
        </p>
        <h2>Contacto y responsable</h2>
        <p>
          Proyecto presentado bajo la marca comercial {legalContact.tradeName}. Responsable del tratamiento:{" "}{legalContact.controllerName ?? "persona física titular pendiente de identificación formal"}.
          Contacto público:{" "}
          <a href={`mailto:${legalContact.email}`}>{legalContact.email}</a>. La marca comercial no sustituye al nombre legal de la persona responsable. La identificación completa y este documento siguen pendientes de revisión jurídica. El contacto facilitado no acredita dicha revisión.
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

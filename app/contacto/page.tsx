import { legalContact } from "@/lib/legal";
export const metadata = { title: "Contacto y correcciones" };
export default function Contact() {
  return (
    <article className="page-section">
      <div className="eyebrow">CONTACTO Y CORRECCIONES</div>
      <h1>
        Una fuente mejor.
        <br />
        Una web mejor.
      </h1>
      <p className="lead">
        Si encuentras una denominación incorrecta, un enlace roto o un problema
        de accesibilidad, cuéntanoslo.
      </p>
      <div className="prose">
        <h2>Escríbenos</h2>
        <p>
          <a href={`mailto:${legalContact.email}`}>{legalContact.email}</a>
        </p>
        <p>
          Incluye la página afectada, qué ocurre y, si corriges un dato, un
          enlace al documento oficial. Para logos, indica la formación,
          circunscripción y fuente oficial de la imagen.
        </p>
        <h2>Solo lo necesario</h2>
        <p>
          No envíes intención de voto, credenciales, DNI, contraseñas ni
          documentación personal. No necesitas compartir tu ubicación para
          comunicar un problema.
        </p>
        <h2>Privacidad</h2>
        <p>
          Este es el contacto público del proyecto y para consultas sobre
          privacidad. El responsable indicado por el promotor es Manuel Lopez
          Sanchz. La información jurídica definitiva sigue pendiente de
          revisión.{" "}
          <a href="/privacidad">Consulta el estado de privacidad y derechos</a>.
        </p>
      </div>
    </article>
  );
}

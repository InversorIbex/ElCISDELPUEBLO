import { legalContact } from "@/lib/legal";
export const metadata = { title: "Aviso legal y condiciones de consulta" };
export default function Legal() {
  return (
    <article className="page-section">
      <div className="eyebrow">INFORMACIÓN DEL PROYECTO</div>
      <h1>Independencia y responsabilidad.</h1>
      <p className="lead">
        Edición pública informativa. La participación política todavía no está
        abierta.
      </p>
      <div className="prose">
        <h2>Identificación y contacto</h2>
        <p>
          {legalContact.controllerName
            ? `Nombre público indicado por el promotor: ${legalContact.controllerName}. La identificación legal completa del responsable sigue pendiente.`
            : "La identidad formal de la persona o entidad responsable está pendiente de completar. Este documento no se presenta como un aviso legal definitivo aprobado."}{" "}
          Contacto:{" "}
          <a href={`mailto:${legalContact.email}`}>{legalContact.email}</a>.
        </p>
        <h2>Proyecto independiente</h2>
        <p>
          El CIS del Pueblo no está vinculado al Centro de Investigaciones
          Sociológicas, al Gobierno de España ni a ningún organismo electoral.
          Los enlaces a organismos públicos identifican fuentes; no implican
          apoyo ni patrocinio.
        </p>
        <h2>Alcance de la información</h2>
        <p>
          El catálogo tiene fecha de revisión y puede requerir cambios
          posteriores. El simulador muestra escenarios hipotéticos introducidos
          por quien lo consulta. No es una predicción electoral. No hay
          resultados reales del sondeo publicados.
        </p>
        <h2>Fuentes y marcas</h2>
        <p>
          Los datos, la cartografía y las imágenes conservan sus atribuciones y
          condiciones específicas. Los logos pertenecen a sus formaciones; su
          presencia tiene finalidad identificativa y no implica afiliación.{" "}
          <a href="/fuentes">Consultar fuentes, transformaciones y límites</a>.
        </p>
        <h2>Correcciones y accesibilidad</h2>
        <p>
          Puedes comunicar errores, dudas sobre derechos de una imagen o
          dificultades de acceso mediante{" "}
          <a href="/contacto">el canal de contacto</a>. Revisaremos la fuente y
          la información afectada.
        </p>
        <h2>Privacidad</h2>
        <p>
          La consulta no exige entregar opiniones políticas. No se incorpora
          analítica de terceros. El alojamiento puede generar registros técnicos
          conforme a su configuración; la revisión de proveedores y conservación
          sigue pendiente. <a href="/privacidad">Información de privacidad</a>.
        </p>
      </div>
    </article>
  );
}

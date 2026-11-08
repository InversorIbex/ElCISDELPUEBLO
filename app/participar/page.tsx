import { TerritorySelector } from "@/components/TerritorySelector";
import { communities, provinces } from "@/lib/territories";
import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
export const metadata: Metadata = { title: "Participar" };
export default function Participate() {
  return (
    <section className="page-section">
      <div className="eyebrow">PARTICIPACIÓN PRIVADA</div>
      <h1>Primero, las garantías.</h1>
      <p className="lead">La recogida de respuestas aún no está abierta.</p>
      <EmptyState
        title="Estamos preparando una participación segura"
        text="Antes de abrir necesitamos revisar las actualizaciones de las candidaturas, completar la evaluación de privacidad y someter el sistema a revisión jurídica y pruebas de seguridad."
      />
      <p className="lead">
        <a href="/candidaturas">
          Elegir circunscripción y consultar candidaturas →
        </a>
      </p>
      <TerritorySelector communities={communities} provinces={provinces} />
      <div className="prose">
        <h2>Una respuesta por credencial, dentro de tu circunscripción</h2>
        <p>
          Elegirás tu circunscripción directamente. El sondeo del Congreso no
          necesitará tu municipio, tu dispositivo ni tu IP para situar la
          respuesta. La credencial del sondeo permitirá cambiar la respuesta y
          reemplazar su cómputo. El navegador no expone un identificador físico
          fiable: borrar sus datos o usar otro navegador impide reconocer esa
          credencial. No garantizamos una respuesta por persona o dispositivo.
        </p>
        <h2>Así será el proceso</h2>
        <ol>
          <li>
            Elegirás manualmente tu circunscripción entre las 52 opciones. El
            catálogo municipal es una ayuda de consulta, no un requisito para
            responder.
          </li>
          <li>
            La selección territorial ya funciona para consultar fichas. Para
            responder, leerás la información de privacidad y decidirás si
            prestas consentimiento explícito.
          </li>
          <li>Seleccionarás una opción válida para tu circunscripción.</li>
          <li>
            Recibirás una credencial privada de ese sondeo para sustituir o
            retirar tu respuesta.
          </li>
        </ol>
        <p>
          No solicitaremos nombre, DNI ni geolocalización. Sin identificación
          fiable no podemos garantizar una respuesta por persona. Este diseño
          todavía debe validarse antes de recoger datos reales.
        </p>
        <p>
          La fecha de las elecciones y el reparto de escaños ya están
          verificados en el BOE. Ya puedes consultar 534 candidaturas
          proclamadas en las 52 circunscripciones, según el BOE y su corrección
          del 7 de noviembre. Consulta nuestra información de privacidad antes
          de cualquier futura participación.
        </p>
      </div>
    </section>
  );
}

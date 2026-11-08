"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="page-section">
      <div className="eyebrow">NO HEMOS PODIDO CARGAR ESTA VISTA</div>
      <h1>Volvamos a intentarlo.</h1>
      <p className="lead">
        Ha ocurrido un problema al abrir la página. Puedes reintentar o volver
        al inicio.
      </p>
      <div className="actions">
        <button type="button" className="button" onClick={reset}>
          Reintentar
        </button>
        <a className="secondary" href="/">
          Volver al inicio →
        </a>
      </div>
    </section>
  );
}

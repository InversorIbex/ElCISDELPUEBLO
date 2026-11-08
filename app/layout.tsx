import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://elcisdelpueblo.vercel.app"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "El Pueblo Opina",
    title: "El Pueblo Opina · La política, con contexto",
    description:
      "Candidaturas por circunscripción, simulador de escaños y comparación con 2023. Observatorio independiente; participación todavía no abierta.",
  },
  twitter: { card: "summary_large_image" },
  title: {
    default: "El Pueblo Opina · Observatorio ciudadano",
    template: "%s · El Pueblo Opina",
  },
  description:
    "Candidaturas por circunscripción, simulador de escaños y fuentes oficiales. Observatorio independiente. Participación todavía no abierta.",
  robots: { index: false, follow: false },
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip" href="#contenido">
          Saltar al contenido
        </a>
        <div className="devbar">
          EDICIÓN PÚBLICA INFORMATIVA{" "}
          <span>· Sin recogida de respuestas políticas</span>
        </div>
        <header>
          <Link
            className="brand"
            href="/"
            aria-label="El Pueblo Opina, inicio"
          >
            <span className="brand-icon">
              p<span>·</span>
            </span>
            <span>
              EL PUEBLO <small>OPINA</small>
            </span>
          </Link>
          <nav aria-label="Navegación principal">
            <Link href="/">Inicio</Link>
            <Link href="/mapa">Territorios</Link>
            <Link href="/resultados">Resultados</Link>
            <Link href="/simulador">Simulador</Link>
            <Link href="/candidaturas">Candidaturas</Link>
            <Link href="/preguntas">Preguntas del pueblo</Link>
            <Link href="/metodologia">Metodología</Link>
          </nav>
          <Link className="button small" href="/participar">
            Elegir mi zona <span>↗</span>
          </Link>
        </header>
        <main id="contenido">{children}</main>
        <footer>
          <div className="footer-top">
            <Link className="wordmark" href="/">
              EL PUEBLO OPINA<span>Un espacio para escuchar.</span>
            </Link>
            <div>
              <Link href="/metodologia">Metodología y transparencia ↗</Link>
              <p>
                <Link href="/fuentes">
                  Fuentes y trazabilidad del catálogo ↗
                </Link>
              </p>
              <p>
                <Link href="/privacidad">
                  Privacidad y control de tu respuesta ↗
                </Link>
              </p>
              <p>
                <Link href="/ayuda">Preguntas frecuentes ↗</Link>
              </p>
              <p>
                <Link href="/contacto">Contacto y correcciones ↗</Link>
              </p>
              <p>
                <Link href="/aviso-legal">Aviso legal ↗</Link>
              </p>
            </div>
          </div>
          <p>
            Esta plataforma es independiente y no está vinculada al Centro de
            Investigaciones Sociológicas, al Gobierno de España ni a ningún
            organismo electoral. Sus resultados provienen de la participación
            voluntaria de internautas y no constituyen una muestra
            estadísticamente representativa.
          </p>
          <div className="footer-bottom">
            <span>Edición informativa · Catálogo INE 2026</span>
            <span>Sin geolocalización · Sin analítica de terceros</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

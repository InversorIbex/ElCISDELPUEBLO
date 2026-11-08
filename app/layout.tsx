import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "El CIS del Pueblo · Observatorio ciudadano",
    template: "%s · El CIS del Pueblo",
  },
  description:
    "Proyecto independiente de sondeos abiertos. Muestra no representativa. Versión de desarrollo sin recogida de respuestas.",
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
          VERSIÓN DE DESARROLLO{" "}
          <span>· Sin recogida de respuestas políticas</span>
        </div>
        <header>
          <Link
            className="brand"
            href="/"
            aria-label="El CIS del Pueblo, inicio"
          >
            <span className="brand-icon">
              c<span>·</span>
            </span>
            <span>
              EL CIS <small>DEL PUEBLO</small>
            </span>
          </Link>
          <nav aria-label="Navegación principal">
            <Link href="/">Inicio</Link>
            <Link href="/mapa">Territorios</Link>
            <Link href="/tendencias">Tendencias</Link>
            <Link href="/simulador">Simulador</Link>
            <Link href="/preguntas">Preguntas del pueblo</Link>
            <Link href="/metodologia">Metodología</Link>
          </nav>
          <Link className="button small" href="/participar">
            Participa ahora <span>↗</span>
          </Link>
        </header>
        <main id="contenido">{children}</main>
        <footer>
          <div className="footer-top">
            <Link className="wordmark" href="/">
              EL CIS DEL PUEBLO<span>Un espacio para escuchar.</span>
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
              <p>Independiente. Abierto. Con límites claros.</p>
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
            <span>Proyecto en desarrollo · Catálogo INE 2026</span>
            <span>Sin geolocalización · Sin analítica de terceros</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

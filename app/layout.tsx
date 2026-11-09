import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isLiveVoteConfigured } from "@/lib/server/live-vote-configuration";
import { LiveVotersCount } from "@/components/LiveResults";
import { JsonLd } from "@/components/JsonLd";
import { KEYWORDS, SITE_NAME, SITE_URL, electionEventLd, organizationLd, websiteLd } from "@/lib/seo";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Encuesta elecciones generales 2026: vota y mira los resultados en vivo · El Pueblo Opina",
    template: "%s · El Pueblo Opina",
  },
  description:
    "¿A quién votarías en las elecciones generales del 29 de noviembre de 2026? Vota en el sondeo ciudadano, mira los resultados por provincia en vivo, el hemiciclo y las candidaturas oficiales de los partidos en tu circunscripción.",
  keywords: KEYWORDS,
  alternates: { canonical: "/", languages: { "es-ES": "/" } },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: SITE_NAME,
    title: "¿A quién votarías el 29-N? Sondeo ciudadano de las elecciones generales 2026",
    description: "Vota en tu provincia y mira en vivo cómo quedaría el Congreso. Candidaturas oficiales de todos los partidos en las 52 circunscripciones.",
  },
  twitter: {
    card: "summary_large_image",
    title: "¿A quién votarías el 29-N? · El Pueblo Opina",
    description: "Sondeo ciudadano de las elecciones generales 2026: mapa por provincias, hemiciclo en vivo y candidaturas oficiales.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  category: "politics",
  formatDetection: { telephone: false },
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <JsonLd nodes={[organizationLd, websiteLd, electionEventLd]} />
        <a className="skip" href="#contenido">
          Saltar al contenido
        </a>
        <div className="devbar">
          {isLiveVoteConfigured() ? (
            <>SONDEO CIUDADANO ABIERTO{" "}<span>· Voluntario, no oficial ni representativo</span></>
          ) : (
            <>EDICIÓN PÚBLICA INFORMATIVA{" "}<span>· Sin recogida de respuestas políticas</span></>
          )}
          <LiveVotersCount />
        </div>
        <header>
          <Link
            className="brand"
            href="/"
            aria-label="El Pueblo Opina, inicio"
          >
            <span className="brand-icon" aria-hidden="true">◉</span>
            <span>
              EL PUEBLO <small>OPINA</small>
            </span>
          </Link>
          <nav aria-label="Navegación principal">
            <Link href="/">Inicio</Link>
            <Link href="/encuesta-elecciones-generales-2026">Encuesta 2026</Link>
            <Link href="/resultados">Resultados</Link>
            <Link href="/partidos">Partidos</Link>
            <Link href="/simulador">Simulador</Link>
            <Link href="/candidaturas">Candidaturas</Link>
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
                <Link href="/encuesta-elecciones-generales-2026">Encuesta elecciones generales 2026 ↗</Link>
              </p>
              <p>
                <Link href="/partidos">Partidos políticos 2026 ↗</Link>
              </p>
              <p>
                <Link href="/mapa">Explorador territorial ↗</Link>
              </p>
              <p>
                <Link href="/preguntas">Preguntas del pueblo ↗</Link>
              </p>
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

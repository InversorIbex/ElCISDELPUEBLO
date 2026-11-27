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
    default: "Elecciones generales 2026: porra, resultados en directo y tu papeleta del 29-N · El Pueblo Opina",
    template: "%s · El Pueblo Opina",
  },
  description:
    "Elecciones generales del 29 de noviembre de 2026: haz tu porra del Congreso, descubre cuánto vale tu voto, mira tu papeleta y sigue el recuento en directo desde las 21:00. Candidaturas oficiales en las 52 circunscripciones.",
  keywords: KEYWORDS,
  alternates: { canonical: "/", languages: { "es-ES": "/" } },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: SITE_NAME,
    title: "Haz tu porra del 29-N: ¿cómo quedará el Congreso?",
    description: "Reparte los 350 escaños, compártelo y compáralo con el recuento oficial en directo. Cuánto vale tu voto, tu papeleta y la brújula electoral.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haz tu porra del 29-N · El Pueblo Opina",
    description: "Porra del Congreso, cuánto vale tu voto, tu papeleta y el recuento en directo de las elecciones generales 2026.",
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
            <Link href="/porra-elecciones-2026">Porra 29-N</Link>
            <Link href="/noche-electoral">Recuento en directo</Link>
            <Link href="/cuanto-vale-mi-voto">Tu voto</Link>
            <Link href="/mi-papeleta">Tu papeleta</Link>
            <Link href="/brujula-electoral">Brújula</Link>
            <Link href="/encuesta-elecciones-generales-2026">Encuesta 2026</Link>
            <Link href="/partidos">Partidos</Link>
          </nav>
          <Link className="button small" href="/porra-elecciones-2026">
            Haz tu porra <span>↗</span>
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
                <Link href="/simulador">Simulador de escaños D&apos;Hondt ↗</Link>
              </p>
              <p>
                <Link href="/candidaturas">Candidaturas por provincia ↗</Link>
              </p>
              <p>
                <Link href="/resultados">Resultados del sondeo ↗</Link>
              </p>
              <p>
                <Link href="/quien-gano-el-debate">¿Quién ganó el debate? ↗</Link>
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

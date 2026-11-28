import type { MetadataRoute } from "next";
import { communities, communityPath, provinces, provincePath } from "@/lib/territories";
import { NATIONAL_PARTIES, partyPath } from "@/lib/parties";
import { SITE_URL } from "@/lib/seo";

/**
 * Páginas con contenido propio. Sin rutas de API ni fichas municipales mínimas.
 * Solo las páginas que cambian en directo llevan la hora actual; el resto, la
 * fecha real de su última revisión (Google ignora un lastModified que siempre es «ahora»).
 */
const REVIEWED = new Date("2026-11-28T12:00:00+01:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  type Freq = "hourly" | "daily" | "weekly";
  const page = (path: string, priority: number, changeFrequency: Freq = "weekly", opts: { live?: boolean; images?: string[] } = {}) => ({
    url: SITE_URL + path,
    lastModified: opts.live ? now : REVIEWED,
    changeFrequency,
    priority,
    ...(opts.images ? { images: opts.images.map((i) => SITE_URL + i) } : {}),
  });
  return [
    page("/", 1, "hourly", { live: true, images: ["/opengraph-image"] }),
    page("/noche-electoral", 1, "hourly", { live: true }),
    page("/porra-elecciones-2026", 0.95, "hourly", { live: true, images: ["/api/porra-imagen"] }),
    page("/mi-papeleta", 0.95, "daily"),
    page("/cuanto-vale-mi-voto", 0.9, "daily"),
    page("/brujula-electoral", 0.9, "daily"),
    page("/partidos", 0.85, "daily"),
    ...NATIONAL_PARTIES.map((p) => page(partyPath(p), 0.8, "daily")),
    ...provinces.map((p) => page(provincePath(p), 0.8, "daily")),
    page("/candidaturas", 0.8),
    page("/encuesta-elecciones-generales-2026", 0.75, "daily"),
    page("/resultados", 0.75, "daily"),
    page("/participar", 0.7, "daily"),
    page("/simulador", 0.7),
    ...communities.map((c) => page(communityPath(c), 0.6)),
    page("/quien-gano-el-debate", 0.5, "weekly", { images: ["/debate/og-debate.jpg"] }),
    ...["/mapa", "/espana", "/metodologia", "/fuentes", "/ayuda", "/preguntas"].map((p) => page(p, 0.5)),
  ];
}

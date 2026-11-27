import type { MetadataRoute } from "next";
import { communities, communityPath, provinces, provincePath } from "@/lib/territories";
import { NATIONAL_PARTIES, partyPath } from "@/lib/parties";
import { SITE_URL } from "@/lib/seo";

/** Páginas con contenido propio. Sin rutas de API ni fichas municipales mínimas. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "hourly" | "daily" | "weekly" = "weekly") =>
    ({ url: SITE_URL + path, lastModified: now, changeFrequency, priority });
  return [
    page("/", 1, "hourly"),
    page("/noche-electoral", 1, "hourly"),
    page("/porra-elecciones-2026", 0.95, "hourly"),
    page("/mi-papeleta", 0.95, "daily"),
    page("/cuanto-vale-mi-voto", 0.9, "daily"),
    page("/brujula-electoral", 0.9, "daily"),
    page("/encuesta-elecciones-generales-2026", 0.85, "hourly"),
    page("/resultados", 0.85, "hourly"),
    page("/participar", 0.9, "daily"),
    page("/partidos", 0.85, "daily"),
    ...NATIONAL_PARTIES.map((p) => page(partyPath(p), 0.8, "daily")),
    page("/candidaturas", 0.8),
    page("/simulador", 0.7),
    ...provinces.map((p) => page(provincePath(p), 0.75, "daily")),
    ...communities.map((c) => page(communityPath(c), 0.6)),
    page("/quien-gano-el-debate", 0.5),
    ...["/mapa", "/espana", "/metodologia", "/fuentes", "/ayuda", "/preguntas"].map((p) => page(p, 0.5)),
  ];
}

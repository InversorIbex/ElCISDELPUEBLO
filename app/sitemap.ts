import type { MetadataRoute } from "next";
import { provinces, provincePath } from "@/lib/territories";
const base = "https://elcisdelpueblo.vercel.app";
export default function sitemap(): MetadataRoute.Sitemap {
  // Curated informational pages only: no vote endpoints, empty results or thin municipal listings.
  const paths = ["/", "/candidaturas", "/simulador", "/mapa", "/espana", "/metodologia", "/fuentes", "/ayuda", "/preguntas"];
  return [
    ...paths.map(path => ({url: base + path, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7})),
    ...provinces.map(p=>({url: base + provincePath(p), changeFrequency: "weekly" as const, priority: 0.65})),
  ];
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    // Las imágenes para compartir tienen que poder leerlas Google Imágenes, X, WhatsApp, Facebook… (respetan robots.txt).
    // Las URL de porras compartidas (?p=) no se indexan (noindex en la página), pero se pueden rastrear.
    rules: { userAgent: "*", allow: ["/", "/api/porra-imagen", "/api/party-logo"], disallow: ["/api/", "/tendencias"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

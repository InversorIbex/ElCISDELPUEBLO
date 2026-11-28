import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    // Las imágenes para compartir tienen que poder leerlas X, WhatsApp, Facebook… (respetan robots.txt).
    rules: { userAgent: "*", allow: ["/", "/api/porra-imagen"], disallow: ["/api/", "/tendencias"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

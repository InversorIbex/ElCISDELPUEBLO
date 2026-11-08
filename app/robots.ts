import type { MetadataRoute } from "next";
const origin = "https://elcisdelpueblo.vercel.app";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/participar", "/resultados", "/tendencias"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}

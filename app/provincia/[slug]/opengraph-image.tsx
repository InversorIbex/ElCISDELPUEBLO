import { OG_FOOTER, OG_SIZE, liveOrNull, ogCard, votesLabel } from "@/lib/server/og-card";
import { displayName, provinces, slugify } from "@/lib/territories";
export const runtime = "nodejs";
export const revalidate = 300;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Sondeo de las elecciones generales 2026 por provincia";
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = provinces.find((x) => slugify(x.name) === slug);
  const name = p ? displayName(p.name) : "tu provincia";
  const data = await liveOrNull();
  const prov = p && data && !data.blackout ? data.provinces[p.code] : undefined;
  return ogCard({
    kicker: "ELECCIONES GENERALES 2026 · SONDEO EN VIVO",
    title: `¿Quién gana en ${name}?`,
    subtitle: prov ? (prov.total ? `${votesLabel(prov.total)} · ${prov.seats} escaños en juego` : "Todavía nadie ha votado aquí. ¡Sé el primero!") : "Vota y míralo en vivo",
    bars: (prov?.rows ?? []).map((r) => ({ label: r.groupName, value: `${r.pct.toFixed(1).replace(".", ",")} %`, color: r.color, width: r.pct })),
    footer: OG_FOOTER,
  });
}

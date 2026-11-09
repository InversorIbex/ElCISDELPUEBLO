import { OG_FOOTER, OG_SIZE, liveOrNull, ogCard, votesLabel } from "@/lib/server/og-card";
export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "¿A quién votarías el 29 de noviembre? Sondeo ciudadano de las elecciones generales 2026 con proyección de escaños en vivo.";
export const size = OG_SIZE;
export const contentType = "image/png";
export default async function Image() {
  const data = await liveOrNull();
  const groups = data && !data.blackout ? [...data.projection.groups].sort((a, b) => b.seats - a.seats) : [];
  return ogCard({
    kicker: "EL PUEBLO OPINA · ELECCIONES GENERALES 29-N",
    title: "¿A quién votarías el 29 de noviembre?",
    subtitle: data ? (data.blackout ? "Veda electoral: resultados ocultos hasta el cierre de los colegios" : `Proyección de escaños en vivo con ${votesLabel(data.totals.votes)}`) : "Vota en tu provincia y mira el Congreso en vivo",
    bars: groups.map((g) => ({ label: g.name, value: `${g.seats} escaños`, color: g.color, width: (g.seats / 350) * 100 })),
    footer: OG_FOOTER,
  });
}

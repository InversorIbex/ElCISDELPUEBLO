import { OG_FOOTER, OG_SIZE, liveOrNull, ogCard, votesLabel } from "@/lib/server/og-card";
import { partyBySlug } from "@/lib/parties";
export const runtime = "nodejs";
export const revalidate = 300;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Partido en las elecciones generales 2026: votos y escaños en el sondeo";
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = partyBySlug((await params).slug);
  const data = await liveOrNull();
  let votes = 0;
  if (p && data) for (const pr of Object.values(data.provinces)) for (const r of pr.rows) if (r.groupId === p.id) votes += r.n;
  const seats = p && data ? data.projection.groups.find((g) => g.id === p.id)?.seats ?? 0 : 0;
  const blackout = data?.blackout;
  return ogCard({
    kicker: "PARTIDOS · ELECCIONES GENERALES 2026",
    title: `${p?.name ?? "Partido"} en la encuesta del 29-N`,
    subtitle: blackout ? "Veda electoral: resultados ocultos hasta el cierre de los colegios" : data ? `${votesLabel(votes)} de ${votesLabel(data.totals.votes)} · ${seats} escaños proyectados` : "Candidaturas por provincia y sondeo en vivo",
    bars: p && !blackout ? [{ label: p.name, value: `${seats} / 350`, color: p.color, width: (seats / 350) * 100 }] : [],
    footer: OG_FOOTER,
  });
}

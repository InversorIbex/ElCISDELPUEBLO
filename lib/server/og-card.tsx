import { ImageResponse } from "next/og";
import { getLiveResults } from "./live-results-service.ts";
import type { LiveResults } from "../live-results.ts";

export const OG_SIZE = { width: 1200, height: 630 };
type Bar = { label: string; value: string; color: string; width: number };

export async function liveOrNull(): Promise<LiveResults | null> {
  try { return await getLiveResults(); } catch { return null; }
}

/** Tarjeta para redes sociales con datos en vivo (siempre con su número de votos). */
export function ogCard({ kicker, title, subtitle, bars = [], footer }: { kicker: string; title: string; subtitle?: string; bars?: Bar[]; footer: string }) {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#f8f8f3", color: "#142c3b", padding: "56px 70px", fontFamily: "sans-serif", borderTop: "16px solid #4e7669" }}>
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#4e7669" }}>{kicker}</div>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.08, marginTop: 18 }}>{title}</div>
      {subtitle && <div style={{ display: "flex", fontSize: 30, marginTop: 14, color: "#3c4a53" }}>{subtitle}</div>}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 26, gap: 12 }}>
        {bars.slice(0, 4).map((b) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", fontSize: 28 }}>
            <div style={{ display: "flex", width: 260 }}>{b.label}</div>
            <div style={{ display: "flex", width: 620, height: 26, background: "#e6e4dc", borderRadius: 13 }}>
              <div style={{ display: "flex", width: `${Math.max(2, Math.min(100, b.width))}%`, height: 26, background: b.color, borderRadius: 13 }} />
            </div>
            <div style={{ display: "flex", marginLeft: 20, fontWeight: 700 }}>{b.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", marginTop: "auto", fontSize: 22, color: "#4e7669" }}>{footer}</div>
    </div>,
    OG_SIZE,
  );
}

export const OG_FOOTER = "Sondeo voluntario, no oficial ni representativo · laopiniondelpueblo.eu";
export const votesLabel = (n: number) => `${new Intl.NumberFormat("es-ES", { useGrouping: "always" } as Intl.NumberFormatOptions).format(n)} ${n === 1 ? "voto" : "votos"}`;

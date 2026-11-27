import { ImageResponse } from "next/og";
import { hemicyclePoints } from "@/lib/parliament";
import { MAJORITY, PORRA_PARTIES, decodePrediction, ranking } from "@/lib/porra";

export const runtime = "nodejs";
const size = { width: 1200, height: 630 };

/** Imagen para compartir la porra (WhatsApp, X, Telegram): el hemiciclo y los 5 primeros. */
export function GET(req: Request) {
  const p = decodePrediction(new URL(req.url).searchParams.get("p"));
  const colors = p
    ? PORRA_PARTIES.flatMap((x) => Array.from({ length: p[x.id] }, () => x.color))
    : Array.from({ length: 350 }, () => "#dce2d7");
  const circles = hemicyclePoints(350)
    .map((pt, i) => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4.1" fill="${colors[i]}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 220" width="620" height="325">${circles}</svg>`;
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const top = p ? ranking(p).slice(0, 5) : [];
  const first = top[0];
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f8f8f3", color: "#142c3b", fontFamily: "sans-serif", borderTop: "16px solid #142c3b", padding: "44px 60px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#4e7669" }}>EL PUEBLO OPINA · LA PORRA DEL 29-N</div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 700, marginTop: 14, lineHeight: 1.05 }}>
          {p ? "Mi porra del Congreso" : "Haz tu porra del Congreso"}
        </div>
        <img src={src} width={620} height={325} style={{ marginTop: 24 }} alt="" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: 30, flex: 1 }}>
        {top.map((x) => (
          <div key={x.id} style={{ display: "flex", alignItems: "center", fontSize: 34, marginBottom: 14 }}>
            <div style={{ display: "flex", width: 22, height: 22, borderRadius: 11, background: x.color, marginRight: 16 }} />
            <div style={{ display: "flex", flex: 1 }}>{x.name}</div>
            <div style={{ display: "flex", fontWeight: 700 }}>{x.seats}</div>
          </div>
        ))}
        <div style={{ display: "flex", fontSize: 24, marginTop: 14, color: "#4e7669" }}>
          {first ? (first.seats >= MAJORITY ? `${first.name}: mayoría absoluta` : `Nadie llega a ${MAJORITY}`) : "Reparte los 350 escaños"}
        </div>
        <div style={{ display: "flex", fontSize: 20, marginTop: 30, color: "#627079" }}>laopiniondelpueblo.eu · ¿y la tuya?</div>
      </div>
    </div>,
    { ...size, headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}

import { ImageResponse } from "next/og";
export const alt =
  "El CIS del Pueblo. Candidaturas, territorio y matemática electoral. Participación todavía no abierta.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: "#f8f8f3",
        color: "#142c3b",
        padding: "65px 75px",
        fontFamily: "sans-serif",
        borderTop: "16px solid #4e7669",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 5 }}>
        EL CIS DEL PUEBLO
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 70,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        <span>La política,</span>
        <span>con contexto.</span>
      </div>
      <div style={{ display: "flex", fontSize: 27 }}>
        52 circunscripciones · 350 escaños · Fuentes oficiales
      </div>
      <div style={{ display: "flex", fontSize: 21, color: "#4e7669" }}>
        Edición informativa · Participación todavía no abierta
      </div>
    </div>,
    size,
  );
}

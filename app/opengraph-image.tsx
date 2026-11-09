import { ImageResponse } from "next/og";
export const alt =
  "El Pueblo Opina. ¿A quién votarías el 29-N? Sondeo ciudadano de las elecciones generales 2026 con resultados en vivo.";
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
        EL PUEBLO OPINA
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
        <span>¿A quién votarías</span>
        <span>el 29 de noviembre?</span>
      </div>
      <div style={{ display: "flex", fontSize: 27 }}>
        Vota en tu provincia · Mapa y hemiciclo en vivo
      </div>
      <div style={{ display: "flex", fontSize: 21, color: "#4e7669" }}>
        Elecciones generales 2026 · Sondeo voluntario, no oficial · laopiniondelpueblo.eu
      </div>
    </div>,
    size,
  );
}

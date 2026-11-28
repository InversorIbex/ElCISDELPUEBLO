"use client";
import { useState } from "react";
import styles from "./ShareButtons.module.css";

/**
 * Botones para compartir: WhatsApp primero (lo que más se usa en España). Sin scripts de terceros.
 * Con `image`, añade un botón que comparte la imagen como archivo (en el móvil se
 * puede elegir X, Instagram o WhatsApp con la foto adjunta) o la descarga en el ordenador.
 */
export function ShareButtons({ text, url, label = "Compártelo", image }: {
  text: string; url: string; label?: string; image?: { url: string; filename: string };
}) {
  const [copied, setCopied] = useState(false);
  const [imageState, setImageState] = useState<"idle" | "busy" | "saved">("idle");
  const full = `${text} ${url}`;
  const enc = encodeURIComponent;
  async function native() {
    try {
      if (navigator.share) await navigator.share({ text, url });
      else await copy();
    } catch { /* cancelado */ }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* sin permiso de portapapeles */ }
  }
  async function shareImage() {
    if (!image || imageState === "busy") return;
    setImageState("busy");
    try {
      const blob = await fetch(image.url).then((r) => { if (!r.ok) throw new Error(); return r.blob(); });
      const file = new File([blob], image.filename, { type: blob.type || "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text: full }); } catch { /* cancelado */ }
        setImageState("idle");
        return;
      }
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href, download: image.filename });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setImageState("saved");
      setTimeout(() => setImageState("idle"), 3000);
    } catch {
      window.open(image.url, "_blank", "noopener");
      setImageState("idle");
    }
  }
  return (
    <div className={styles.share} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <a className={`${styles.btn} ${styles.whatsapp}`} href={`https://wa.me/?text=${enc(full)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className={styles.btn} href={`https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">X</a>
      <a className={styles.btn} href={`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`} target="_blank" rel="noopener noreferrer">Telegram</a>
      <button type="button" className={styles.btn} onClick={copy}>{copied ? "Copiado ✓" : "Copiar enlace"}</button>
      {image && (
        <button type="button" className={styles.btn} onClick={shareImage} disabled={imageState === "busy"}>
          {imageState === "busy" ? "Preparando…" : imageState === "saved" ? "Imagen descargada ✓" : "Compartir imagen"}
        </button>
      )}
      <button type="button" className={`${styles.btn} ${styles.more}`} onClick={native}>Más ↗</button>
    </div>
  );
}

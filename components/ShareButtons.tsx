"use client";
import { useState } from "react";
import styles from "./ShareButtons.module.css";

/** Botones para compartir: WhatsApp primero (lo que más se usa en España). Sin scripts de terceros. */
export function ShareButtons({ text, url, label = "Compártelo" }: { text: string; url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
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
  return (
    <div className={styles.share} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <a className={`${styles.btn} ${styles.whatsapp}`} href={`https://wa.me/?text=${enc(full)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className={styles.btn} href={`https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">X</a>
      <a className={styles.btn} href={`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`} target="_blank" rel="noopener noreferrer">Telegram</a>
      <button type="button" className={styles.btn} onClick={copy}>{copied ? "Copiado ✓" : "Copiar enlace"}</button>
      <button type="button" className={`${styles.btn} ${styles.more}`} onClick={native}>Más ↗</button>
    </div>
  );
}

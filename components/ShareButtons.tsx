"use client";
import { useState } from "react";
import styles from "./ShareButtons.module.css";

const SITE = "https://www.laopiniondelpueblo.eu";

/** Botones para compartir (sin scripts de terceros ni rastreo: solo enlaces). */
export function ShareButtons({ path = "/", text, compact = false }: { path?: string; text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE}${path}`;
  const t = encodeURIComponent(text), u = encodeURIComponent(url), tu = encodeURIComponent(`${text} ${url}`);
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${tu}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ];
  async function copy() {
    try {
      if (navigator.share) { await navigator.share({ title: "El Pueblo Opina", text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* cancelado */ }
  }
  return <div className={`${styles.share} ${compact ? styles.compact : ""}`}>
    {!compact && <strong>Compártelo y haz que vote más gente:</strong>}
    <div className={styles.row}>
      {links.map((l) => <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer">{l.name}</a>)}
      <button type="button" onClick={copy}>{copied ? "¡Copiado!" : "Copiar enlace"}</button>
    </div>
  </div>;
}

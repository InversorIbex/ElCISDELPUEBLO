#!/usr/bin/env node
/**
 * Avisa a Bing, Yandex, Seznam y Naver (IndexNow) de las URL del sitemap para que
 * las rastreen ya. Google no usa IndexNow: para Google, envía el sitemap en Search Console.
 *
 *   node scripts/indexnow.mjs [https://www.laopiniondelpueblo.eu]
 *
 * Solo funciona con el despliegue en producción: la clave tiene que estar publicada en
 * https://www.laopiniondelpueblo.eu/8ca0cf566a43e75fcb1537d97416102b.txt
 */
const KEY = "8ca0cf566a43e75fcb1537d97416102b";
const site = (process.argv[2] ?? "https://www.laopiniondelpueblo.eu").replace(/\/$/, "");
const host = new URL(site).host;

const keyFile = await fetch(`${site}/${KEY}.txt`);
if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) {
  console.error(`La clave no está publicada en ${site}/${KEY}.txt. ¿Está desplegado?`);
  process.exit(1);
}
const xml = await (await fetch(`${site}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => new URL(u).host === host);
if (!urlList.length) { console.error("El sitemap no tiene URL."); process.exit(1); }

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${site}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} · ${urlList.length} URL enviadas`);
if (res.status >= 400) { console.error(await res.text()); process.exit(1); }

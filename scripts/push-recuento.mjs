#!/usr/bin/env node
/**
 * Carga el recuento oficial de la noche electoral en la web.
 *
 *   RECUENTO_ADMIN_TOKEN=... node scripts/push-recuento.mjs recuento.json [https://www.laopiniondelpueblo.eu]
 *
 * recuento.json (ids de partido: PSOE, PP, VOX, FA, PODEMOS, SALF, ERC,
 * JUNTS, BILDU, PNV, BNG, CC, UPN, OTROS):
 * {
 *   "scrutinized": 62.4,
 *   "turnout": 68.1,
 *   "turnoutUpdates": [{ "time": "14:00", "pct": 36.2, "pct2023": 37.7 }],
 *   "parties": [{ "id": "PP", "seats": 140, "votesPct": 33.5 }],
 *   "final": false
 * }
 * Solo datos del escrutinio provisional del Ministerio del Interior. Los
 * escaños no se muestran antes de las 21:00 del 29-N aunque se carguen.
 */
import { readFile } from "node:fs/promises";

const [file, base = "https://www.laopiniondelpueblo.eu"] = process.argv.slice(2);
const token = process.env.RECUENTO_ADMIN_TOKEN;
if (!file || !token) {
  console.error("Uso: RECUENTO_ADMIN_TOKEN=... node scripts/push-recuento.mjs recuento.json [url-base]");
  process.exit(2);
}
const body = await readFile(file, "utf8");
JSON.parse(body); // falla aquí si el JSON está mal escrito
const res = await fetch(`${base.replace(/\/$/, "")}/api/recuento`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body,
});
const out = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Error ${res.status}:`, out.error ?? out);
  process.exit(1);
}
const seats = (out.public?.parties ?? []).map((p) => `${p.id} ${p.seats}`).join(" · ");
console.log(`Guardado. Estado público: ${out.public?.status}. ${seats || "(escaños ocultos hasta las 21:00)"}`);

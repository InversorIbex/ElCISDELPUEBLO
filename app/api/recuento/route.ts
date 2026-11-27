import { timingSafeEqual } from "node:crypto";
import { getVotePool } from "@/lib/server/vote-db";
import { readRecuento, saveRecuento } from "@/lib/server/recuento";
import { parseRecuento, publicRecuento } from "@/lib/election-night";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hasDb = () => /^postgres(?:ql)?:\/\//.test(process.env.VOTE_DATABASE_URL ?? "");
let cache: { at: number; body: unknown } | null = null;
const CACHE_MS = 10_000;

/** Recuento público. Antes de las 21:00 del 29-N no devuelve escaños ni votos. */
export async function GET() {
  const configured = hasDb() && (process.env.RECUENTO_ADMIN_TOKEN?.length ?? 0) >= 32;
  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      const payload = hasDb() ? await readRecuento(getVotePool()) : null;
      cache = { at: Date.now(), body: publicRecuento(payload, configured) };
    }
    return Response.json(cache.body, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } });
  } catch {
    return Response.json(publicRecuento(null, configured), { headers: { "Cache-Control": "no-store" } });
  }
}

function authorized(req: Request) {
  const token = process.env.RECUENTO_ADMIN_TOKEN ?? "";
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (token.length < 32 || given.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(token));
}

/** Carga del operador (scripts/push-recuento.mjs). Solo datos oficiales del escrutinio. */
export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!hasDb()) return Response.json({ error: "NO_DATABASE" }, { status: 503 });
  let payload;
  try {
    const raw = await req.text();
    if (raw.length > 16_384) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    payload = parseRecuento(JSON.parse(raw));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "INVALID_BODY" }, { status: 400 });
  }
  try {
    await saveRecuento(getVotePool(), payload);
    cache = null;
    return Response.json({ saved: true, public: publicRecuento(payload, true) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "TEMPORARILY_UNAVAILABLE" }, { status: 503 });
  }
}

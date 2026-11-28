import { isIP } from "node:net";
import { cookies } from "next/headers";
import { getVotePool } from "@/lib/server/vote-db";
import { readMyPorra, readPorraRanking, savePorraEntry } from "@/lib/server/porra-entries";
import { readRecuento } from "@/lib/server/recuento";
import { isLiveVoteConfigured } from "@/lib/server/live-vote-configuration";
import { publicRecuento, recuentoAsPrediction } from "@/lib/election-night";
import { PORRA_CLOSES_AT, PORRA_RANKING_FROM, isPorraOpen } from "@/lib/porra";
import type { RankedEntry } from "@/lib/porra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 50;
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

let cache: { at: number; ranking: RankedEntry[]; status: string; scrutinized: number | null; scored: boolean } | null = null;
const CACHE_MS = 20_000;

async function ranking() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const pool = getVotePool();
  const recuento = publicRecuento(await readRecuento(pool), true);
  const actual = recuentoAsPrediction(recuento);
  const list = await readPorraRanking(pool, actual);
  cache = { at: Date.now(), ranking: list, status: recuento.status, scrutinized: recuento.scrutinized, scored: Boolean(actual) };
  return cache;
}

/**
 * Estado de la porra, la porra apuntada desde este navegador y, tras la veda
 * y con escaños en el recuento, la clasificación. Nunca devuelve medias ni
 * sumas de las porras.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const from = Math.max(0, Math.min(1_000_000, Number.parseInt(params.get("desde") ?? "0", 10) || 0));
  const q = (params.get("q") ?? "").normalize("NFC").trim().toLowerCase().slice(0, 24);
  const enabled = isLiveVoteConfigured();
  const base = { enabled, open: isPorraOpen(), closesAt: PORRA_CLOSES_AT.toISOString(), rankingFrom: PORRA_RANKING_FROM.toISOString() };
  if (!enabled) return json({ ...base, mine: null, ranking: [], total: 0, myPosition: null });
  try {
    const cookie = (await cookies()).get("epov_anon_v1")?.value;
    const mine = cookie ? await readMyPorra(getVotePool(), process.env.VOTE_HMAC_SECRET!, cookie) : null;
    const r = Date.now() >= PORRA_RANKING_FROM.getTime() ? await ranking() : null;
    const list = r?.ranking ?? [];
    const pos = mine ? list.findIndex((x) => x.alias === mine.alias) : -1;
    const all = list.map((x, i) => ({ position: i + 1, ...x }));
    const found = q ? all.filter((x) => x.alias.toLowerCase().includes(q)) : all;
    return json({
      ...base, mine,
      recuentoStatus: r?.status ?? null, scrutinized: r?.scrutinized ?? null, scored: r?.scored ?? false,
      ranking: found.slice(from, from + PAGE),
      matches: found.length,
      total: list.length,
      myPosition: pos >= 0 ? { position: pos + 1, ...list[pos] } : null,
    });
  } catch {
    return json({ ...base, mine: null, ranking: [], total: 0, myPosition: null, error: "TEMPORARILY_UNAVAILABLE" }, 503);
  }
}

function validOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return Boolean(origin && origin === new URL(req.url).origin
    && new URL(origin).hostname === process.env.VOTE_ALLOWED_HOSTNAME);
}
function trustedIp(req: Request): string | null {
  if (!process.env.VERCEL) return null;
  const ip = req.headers.get("x-vercel-forwarded-for");
  return ip && isIP(ip) !== 0 ? ip : null;
}
async function verifyChallenge(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || token.length < 1 || token.length > 2048) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
    return result.success === true && result.hostname === process.env.VOTE_ALLOWED_HOSTNAME && result.action === "porra";
  } catch { return false; }
}

/** Apunta (o cambia) la porra de este navegador para la clasificación. */
export async function POST(req: Request) {
  if (!isLiveVoteConfigured()) return json({ error: "VOTE_CLOSED" }, 423);
  if (!isPorraOpen()) return json({ recorded: false, code: "CLOSED" }, 403);
  if (!validOrigin(req) || req.headers.get("x-vote-request") !== "1") return json({ error: "INVALID_ORIGIN" }, 403);
  if (!(req.headers.get("content-type") ?? "").startsWith("application/json")) return json({ error: "INVALID_CONTENT_TYPE" }, 415);
  const ip = trustedIp(req);
  if (!ip) return json({ error: "UNVERIFIED_CLIENT_IP" }, 403);
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: "PAYLOAD_TOO_LARGE" }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: "INVALID_JSON" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "INVALID_REQUEST" }, 400);
  const b = body as Record<string, unknown>;
  if (b.explicitConsent !== true) return json({ error: "CONSENT_REQUIRED" }, 400);
  if (typeof b.turnstileToken !== "string") return json({ error: "INVALID_REQUEST" }, 400);
  const cookie = (await cookies()).get("epov_anon_v1")?.value;
  if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) return json({ error: "SESSION_REQUIRED" }, 403);
  if (!await verifyChallenge(b.turnstileToken, ip)) return json({ error: "CHALLENGE_INVALID" }, 403);
  try {
    const result = await savePorraEntry(getVotePool(), process.env.VOTE_HMAC_SECRET!, {
      alias: b.alias, code: b.code, browserToken: cookie, ip,
    });
    if (result.accepted) return json({ recorded: true, ...result, mine: { alias: result.alias, code: result.prediction } });
    if (result.code === "IP_WINDOW_LIMIT")
      return json({ recorded: false, code: result.code, retryAfterSeconds: result.retryAfterSeconds }, 429,
        { "Retry-After": String(result.retryAfterSeconds) });
    const status = result.code === "CLOSED" ? 403 : result.code === "ALIAS_TAKEN" ? 409 : 400;
    return json({ recorded: false, code: result.code }, status);
  } catch {
    return json({ recorded: false, error: "TEMPORARILY_UNAVAILABLE" }, 503);
  }
}

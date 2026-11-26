import { isIP } from "node:net";
import { cookies } from "next/headers";
import { getVotePool } from "@/lib/server/vote-db";
import { readDebateShares, saveDebateVote } from "@/lib/server/debate-vote";
import { isLiveVoteConfigured } from "@/lib/server/live-vote-configuration";
import { DEBATE_ID, DEBATE_VOTE_CLOSES_AT, debatePercentages, isDebateVoteOpen } from "@/lib/debate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

let cache: { at: number; body: unknown } | null = null;
const CACHE_MS = 5000;

/** Porcentajes de la votación del debate. Nunca devuelve el número de votos. */
export async function GET() {
  const enabled = isLiveVoteConfigured();
  try {
    if (!enabled) {
      const empty = debatePercentages({});
      return json({ debateId: DEBATE_ID, enabled, open: isDebateVoteOpen(), closesAt: DEBATE_VOTE_CLOSES_AT.toISOString(), ...empty });
    }
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      cache = { at: Date.now(), body: { ...(await readDebateShares(getVotePool())), enabled } };
    }
    return Response.json(cache.body, {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
    });
  } catch {
    return json({ error: "RESULTS_UNAVAILABLE" }, 503);
  }
}

function validOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return Boolean(origin && origin === new URL(req.url).origin
    && new URL(origin).hostname === process.env.VOTE_ALLOWED_HOSTNAME);
}
function trustedIp(req: Request): string | null {
  if (!process.env.VERCEL) return null;
  // Vercel sobrescribe este campo en cada petición entrante.
  const ip = req.headers.get("x-vercel-forwarded-for");
  return ip && isIP(ip) !== 0 ? ip : null;
}
async function verifyChallenge(token: string, ip: string, requestId: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || token.length < 1 || token.length > 2048) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip, idempotency_key: requestId }),
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
    return result.success === true && result.hostname === process.env.VOTE_ALLOWED_HOSTNAME
      && result.action === "debate_vote";
  } catch { return false; }
}

export async function POST(req: Request) {
  if (!isLiveVoteConfigured()) return json({ error: "VOTE_CLOSED" }, 423);
  if (!isDebateVoteOpen()) return json({ recorded: false, code: "CLOSED" }, 403);
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
  const { optionId, requestToken, turnstileToken } = b;
  if (typeof optionId !== "string" || typeof requestToken !== "string" || typeof turnstileToken !== "string")
    return json({ error: "INVALID_REQUEST" }, 400);
  const cookie = (await cookies()).get("epov_anon_v1")?.value;
  if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) return json({ error: "SESSION_REQUIRED" }, 403);
  if (!await verifyChallenge(turnstileToken, ip, requestToken)) return json({ error: "CHALLENGE_INVALID" }, 403);
  try {
    const result = await saveDebateVote(getVotePool(), process.env.VOTE_HMAC_SECRET!, {
      optionId, browserToken: cookie, ip, requestToken,
    });
    if (result.accepted) {
      cache = null;
      return json({ recorded: true, code: "RECORDED", ...(await readDebateShares(getVotePool())) });
    }
    if (result.code === "IP_WINDOW_LIMIT")
      return json({ recorded: false, code: result.code, retryAfterSeconds: result.retryAfterSeconds }, 429,
        { "Retry-After": String(result.retryAfterSeconds) });
    const status = result.code === "INVALID_OPTION" || result.code === "INVALID_TOKEN" ? 400 : result.code === "CLOSED" ? 403 : 409;
    return json({ recorded: false, code: result.code }, status);
  } catch {
    return json({ recorded: false, error: "TEMPORARILY_UNAVAILABLE" }, 503);
  }
}

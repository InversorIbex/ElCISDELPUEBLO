import { timingSafeEqual } from "node:crypto";
import { randomSimulatedVotes, simulatedVotesPerTick } from "@/lib/live-results";
import { invalidateLiveResults, simulationEnabled } from "@/lib/server/live-results-service";
import { saveSimulatedVotes } from "@/lib/server/public-vote";
import { getVotePool } from "@/lib/server/vote-db";

/**
 * Modo demostración: añade votos SIMULADOS (siempre marcados simulated=true y
 * anunciados en la web). Invocado cada 5 minutos por GitHub Actions
 * (.github/workflows/simulador.yml) con `Authorization: Bearer <CRON_SECRET>`.
 * Ritmo: 4 por ejecución el primer día, ×2 cada día, hasta SIMULATION_MAX_PER_TICK.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32 || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(header, "utf8");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function handle(req: Request) {
  if (!authorized(req.headers.get("authorization"))) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: noStore });
  if (!simulationEnabled()) return Response.json({ error: "SIMULATION_DISABLED" }, { status: 409, headers: noStore });
  const start = new Date(process.env.SIMULATION_START ?? "");
  if (Number.isNaN(start.getTime())) return Response.json({ error: "SIMULATION_START_INVALID" }, { status: 500, headers: noStore });
  const max = Math.min(5000, Math.max(1, Number.parseInt(process.env.SIMULATION_MAX_PER_TICK ?? "512", 10) || 512));
  const perTick = simulatedVotesPerTick(start, new Date(), 4, max);
  try {
    const inserted = await saveSimulatedVotes(getVotePool(), randomSimulatedVotes(perTick));
    await getVotePool().query("DELETE FROM poll_private.ip_window WHERE hit_at <= now() - interval '5 hours'");
    invalidateLiveResults();
    return Response.json({ ok: true, inserted, perTick }, { headers: noStore });
  } catch {
    return Response.json({ error: "SIMULATION_FAILED" }, { status: 503, headers: noStore });
  }
}
export const GET = handle;
export const POST = handle;

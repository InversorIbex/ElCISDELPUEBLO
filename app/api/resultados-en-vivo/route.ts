import { getLiveResults } from "@/lib/server/live-results-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Caché corta en la CDN de Vercel: todas las visitas comparten la misma lectura.
    return Response.json(await getLiveResults(), {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
    });
  } catch {
    return Response.json({ error: "RESULTS_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

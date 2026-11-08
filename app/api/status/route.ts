import { participationStatus, project } from "../../../lib/project.ts";
export function GET() {
  return Response.json(
    {
      stage: project.stage,
      participation: participationStatus(),
      resultsAvailable: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export function POST() {
  return Response.json(
    { error: "La recogida de respuestas no está habilitada." },
    { status: 403 },
  );
}

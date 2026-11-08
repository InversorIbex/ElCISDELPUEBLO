import {
  closedParticipationResponse,
  launchStatus,
} from "../../../lib/server/privacy-gates.ts";
export function GET() {
  return Response.json(launchStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
// No leer el body ni conectar a base de datos mientras las puertas estén pendientes.
export function POST() {
  return closedParticipationResponse();
}

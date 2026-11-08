import { closedParticipationResponse } from "../../../../lib/server/privacy-gates.ts";
export function POST() {
  return closedParticipationResponse();
}

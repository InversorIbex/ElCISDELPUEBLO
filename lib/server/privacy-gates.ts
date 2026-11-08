export const launchRequirements = [
  {
    id: "controller",
    label: "Responsable y canal para ejercer derechos",
    state: "pending",
  },
  {
    id: "legal",
    label: "Revisión jurídica de bases de los artículos 6 y 9 RGPD",
    state: "pending",
  },
  {
    id: "dpia",
    label: "Evaluación de impacto y riesgo residual aceptado",
    state: "pending",
  },
  {
    id: "retention",
    label: "Conservación, borrado y restauración probados",
    state: "pending",
  },
  {
    id: "security",
    label: "Revisión de seguridad, MFA y antifraude operativo",
    state: "pending",
  },
  {
    id: "ballots",
    label: "Revisión final de papeletas y actualizaciones posteriores",
    state: "pending",
  },
  {
    id: "release",
    label: "Reglas de publicación y ataques por diferencias revisados",
    state: "pending",
  },
] as const;
export function launchStatus() {
  return {
    enabled: false as const,
    mode: "closed" as const,
    requirements: launchRequirements,
  };
}
export function closedParticipationResponse() {
  return Response.json(
    {
      error: "PARTICIPATION_CLOSED",
      message:
        "La recogida de respuestas no está habilitada. No envíes opiniones ni credenciales.",
      enabled: false,
    },
    { status: 423, headers: { "Cache-Control": "no-store" } },
  );
}

export const project = {
  participationEnabled: false,
  minimumReleaseSize: 50,
  officialElectionVerified: true,
  officialCandidaciesVerified: false,
  stage: "Desarrollo — laboratorio, mapa y simulación manual",
} as const;
export function participationStatus() {
  return {
    enabled: project.participationEnabled,
    reason:
      "Recogida cerrada: pendientes candidaturas oficiales, revisión jurídica y controles de seguridad.",
  };
}

export const project = {
  participationEnabled: false,
  minimumReleaseSize: 50,
  officialElectionVerified: true,
  officialCandidaciesVerified: true,
  stage: "Edición pública informativa — participación cerrada",
} as const;
export function participationStatus() {
  return {
    enabled: project.participationEnabled,
    reason:
      "Recogida cerrada: pendientes revisión final de papeletas, revisión jurídica y controles de seguridad.",
  };
}

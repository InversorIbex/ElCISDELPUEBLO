export const project = {
  participationEnabled: false,
  minimumReleaseSize: 50,
  officialElectionVerified: false,
  stage: 'Hito 1 — base de desarrollo',
} as const;
export function participationStatus() {
  return { enabled: project.participationEnabled, reason: 'Recogida cerrada: pendientes catálogo oficial, revisión jurídica y controles de seguridad.' };
}

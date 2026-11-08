export const project = {
  participationEnabled: false,
  minimumReleaseSize: 50,
  officialElectionVerified: false,
  stage: 'Hito 2 — catálogo territorial oficial',
} as const;
export function participationStatus() {
  return { enabled: project.participationEnabled, reason: 'Recogida cerrada: pendientes candidaturas oficiales, revisión jurídica y controles de seguridad.' };
}

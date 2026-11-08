# Conservación, proveedores e incidentes — borrador operativo

No aplicado a producción. No existe contratación ni despliegue de recogida sensible.

| Dato                                | Propuesta inicial                                           | Estado                                                         |
| ----------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Token de participación              | expira a 15 min; purgar expirados/usados en ventanas cortas | expiración implementada; job de borrado pendiente              |
| Credencial/consentimiento/respuesta | campaña activa + máximo propuesto 30 días tras cierre       | retirada activa probada; calendario y justificación pendientes |
| Rate bucket                         | ventana hasta 1 h; borrar después de expiración             | límite transaccional probado; scheduler pendiente              |
| Eventos antifraude                  | mínimo imprescindible, propuesta 7 días, sin opción         | sin colector operativo                                         |
| Backups y WAL                       | copias cifradas, propuesta 30 días; reaplicar retiradas     | sin infraestructura ni ensayo de restauración                  |
| Publicaciones                       | solo si son no identificables tras evaluación               | prototipo exclusivamente sintético                             |

Los periodos son propuestas, no plazos legales aprobados. Determinar evidencia necesaria del consentimiento sin retener preferencias. La eliminación en tablas no borra inmediatamente WAL, snapshots ni copias; comunicar garantías reales.

## Proveedores

Inventario pendiente: hosting, PostgreSQL, gestor de claves, CDN/objetos de cartografía, protección de automatización y soporte. Para cada uno: finalidad, datos exactos, región efectiva, subencargados, transferencias, contrato, acceso de soporte, logs, retención y contacto de incidentes. No integrar analítica publicitaria ni observabilidad que capture cuerpos/headers de credenciales. Los parámetros del simulador nunca salen del navegador.

## Incidentes

1. Detener recogida mediante cierre operativo; preservar evidencia mínima sin duplicar opiniones.
2. Aislar acceso comprometido, rotar claves y evaluar alcance/capacidad de descifrado, credenciales y publicaciones.
3. Documentar tiempos, afectados, riesgo para derechos y medidas; responsable/jurista determina notificación y comunicación conforme a arts. 33/34, incluidas condiciones y plazos.
4. Restaurar en entorno aislado, verificar integridad, reaplicar retiradas y no reabrir hasta revisión. No prometer que borrar una publicación elimina copias ya descargadas.
5. Registrar aprendizaje y revisar EIPD. No exportar datos sensibles a tickets externos para diagnosticar.

## Evidencias técnicas actuales

PostgreSQL desechable 17 con catálogo oficial y opciones sintéticas; migraciones con checksums, transacciones, pruebas de concurrencia/corrección/retirada, roles PUBLIC bloqueados y cifrado AEAD en memoria. El rol de tests es propietario: no demuestra separación de privilegios de una aplicación desplegada. Faltan MFA, RBAC de administrador, gestión de claves externa, rotación, Turnstile real, copias, restauración, pruebas de intrusión y E2E.

# Estado del plan completo

Actualización 8/11/2026. Cada línea distingue implementación técnica de autorización y preparación de producción.

| Hito                    | Implementado y comprobado                                                                                                                                                                                    | Falta / criterio de cierre                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Arquitectura y diseño | Next estricto, páginas, navegación, avisos y arquitectura                                                                                                                                                    | revisión visual completa en navegador, no solo build                                                                                                            |
| 2 Territorio INE        | 8.132 municipios, búsqueda/jerarquía, API, fichas; ahora importación PostgreSQL probada                                                                                                                      | actualizaciones registrales posteriores al 1/1/2026; pipeline operativo de versionado                                                                           |
| 3 Privacidad            | EIPD de trabajo, consentimiento/derechos, operación/retención, controles cerrados                                                                                                                            | revisión de identificación facilitada (Manuel Lopez Sanchz); dictamen jurídico; EIPD aprobada; proveedores y plazos definitivos                                 |
| 4 Motor                 | PostgreSQL de laboratorio: tokens, AEAD, credenciales por campaña, consentimiento, corrección, retirada, deltas atómicos, primitiva rate limit, aislamiento y concurrencia                                   | API pública cerrada; Turnstile real y políticas antifraude; KMS/roles; revisión de cambios posteriores de candidaturas; revisión de seguridad; pruebas HTTP/E2E |
| 5 Agregación            | contadores internos y prototipo de publicación nacional única de campaña cerrada sintética; denominadores comprobados                                                                                        | política real de privacidad/reconstrucción; dashboard con datos públicos reales; publicación segura periódica                                                   |
| 6 Cartografía           | vista autonómica SVG navegable con geometrías IGN, 19 unidades, recuadros y atribución                                                                                                                       | capas provincia/municipio, PMTiles/MapLibre, métricas, leyendas de resultados y evaluación móvil/WebGL                                                          |
| 7 Histórico             | especificación y restricciones contra diferencias                                                                                                                                                            | hay gráfico de evolución de escenarios manuales; no hay series reales ni snapshots periódicos; resolver privacidad antes de implementarlos                      |
| 8 Preguntas y admin     | motor sintético de respuesta única independiente de electoral probado                                                                                                                                        | múltiples tipos/versionado/calendarios/archivo; admin real OIDC/MFA/RBAC, auditoría y moderación                                                                |
| 9 Simulador             | modo A manual local, 52 circunscripciones oficiales, D’Hondt, blanco/nulo, 3%, cocientes exactos y desempate limitado, agregación provincial manual y hemiciclos comparados con resultados oficiales de 2023 | UI E2E; empate múltiple y mayoría igual se dejan sin resolver. Modo B cerrado por falta de cobertura                                                            |
| 10 Calidad/despliegue   | tests unitarios/integración SQL, CI con PostgreSQL, build/tipos, HTML, auditoría de dependencias, noindex/robots/sitemap vacía                                                                               | navegador, a11y, carga, pentest, recuperación, proveedor/contratos, gasto/alertas, revisión jurídica y despliegue                                               |

La interfaz informativa está publicada en Vercel; no hay fecha de apertura de votos reales. Las campañas SQL están forzadas a `is_test=true`; los endpoints de respuesta devuelven 423 antes de leer el contenido. La convocatoria, los escaños y la instantánea de candidaturas de 2026 están verificados a 8/11/2026; logos con cobertura parcial.

## Orden de continuación

1. Completar identidad del responsable, revisar expediente jurídico y decidir infraestructura/región/KMS; continuar sin datos reales.
2. Ampliar seguridad del motor y privilegios reales; pruebas HTTP, navegador, migraciones/restauración. Medir límites del bloqueo por campaña y decidir optimización sin perder consistencia.
3. Verificar papeletas provinciales en BOE/JEC con trazabilidad y revisión de cambios. No convertir etiquetas sintéticas en candidaturas reales.
4. Diseñar publicación con privacidad para jerarquía y series; después integrar dashboard, tendencias y comparación. La publicación única del prototipo no resuelve esos casos.
5. Completar pipeline cartográfico provincial/municipal, preguntas versionadas y administración MFA.
6. Staging sin datos reales, auditorías, coste/límites y recuperación; apertura solo al cumplir todas las condiciones.

El plan se conserva completo. Esta continuación no declara terminados diez hitos cuando solo hay partes implementadas.

## Continuación: candidaturas y circunscripción

Ver `CONTINUACION-CANDIDATURAS-Y-GRAFICOS.md`: catálogo provincial, logos parciales, reducción de datos al nivel de circunscripción y comparación histórica. Ninguno de estos cambios abre el sondeo.

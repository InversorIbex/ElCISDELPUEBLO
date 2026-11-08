# Plan por hitos
Cada hito cerrará objetivo, archivos, funciones, pruebas/resultados, riesgos y siguientes pasos en su informe. No se abre recogida real en los primeros tres.

| Hito | Objetivo / entregables previstos | Prueba de aceptación y riesgo principal |
|---|---|---|
| 1 | Next estricto, diseño, navegación, arquitectura, SQL inicial | build, tipos, handlers HTTP y revisión visual cuando haya navegador; no confundir base con producto completo |
| 2 | importador INE, catálogo completo, buscador/jerarquía | conteo oficial, códigos/relaciones, acentos, cooficiales, Ceuta/Melilla; datos desactualizados |
| 3 | evaluación privacidad, consentimiento y revocación | revisión especializada, modelo de amenazas/EIPD, flujo de derechos; sin responsable no abrir |
| 4 | migraciones sensibles, API transaccional, tokens/antifraude | corrección, idempotencia, concurrencia, aislamiento, CSRF, límites, Turnstile servidor; duplicidad residual |
| 5 | agregados internos, publicación segura, dashboard | cálculos/denominadores, supresión complementaria y ataques por diferencias; k no basta |
| 6 | MapLibre/PMTiles, fichas y rutas territoriales | geometrías/INE, navegación y alternativa textual, móviles; licencia y tamaño |
| 7 | snapshots, comparación y tendencias | series acumuladas/intervalos, retiradas y diferencias temporales; reconstrucción |
| 8 | preguntas versionadas, admin OIDC/MFA/RBAC | aislamiento preguntas, no edición retrospectiva, autorización y auditoría; abuso interno |
| 9 | D'Hondt por provincia, simulador manual | fixtures verificables, 3%, blanco/nulo, empate/sorteo y Ceuta/Melilla; configuración oficial pendiente |
| 10 | accesibilidad, seguridad, rendimiento, SEO/despliegue | E2E, auditoría, carga, recuperación, revisión legal; abrir solo tras resolver críticos |

## Informe Hito 1
Objetivo: base navegable honesta, decisiones técnicas y plan de implementación.
Archivos: `app/`, `components/`, `lib/`, `tests/`, configuración Next/TypeScript y lockfile; `docs/` y `db/migrations/0001_foundation.sql`.
Implementado: portada editorial responsive, páginas de estado de participación/mapa/tendencias/preguntas, metodología, API de estado con rechazo POST, avisos de no representatividad, bloqueo de geolocalización por cabecera, no indexación de desarrollo. No hay cartografía, catálogo, opiniones, persistencia ni admin funcionales.
Pruebas/resultados: ver `VALIDACION.md`, generado al terminar comprobaciones.
Riesgos: no hay verificación oficial de elección; no hay revisión jurídica; SQL no aplicado; no se ha certificado accesibilidad o escala. CSP admite inline y requiere revisión para producción. Las páginas territoriales con datos se crearán después del catálogo, evitando páginas vacías indexables.
Siguiente paso: Hito 2 con importación INE trazable; en paralelo documental Hito 3 sin habilitar recogida.

## Informe Hito 2
Ver `HITO-2.md`: catálogo oficial de 8.132 municipios, importador con validación/reemplazo atómico, búsqueda y selección jerárquica, API territorial, directorios y fichas navegables, fuentes y trazabilidad. 14 pruebas Node y 4 pruebas de importación Python. PostgreSQL, navegador y cartografía siguen pendientes; no se declara este hito como validación de producción.

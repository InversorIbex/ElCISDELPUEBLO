# Continuación técnica — privacidad, motor de laboratorio, mapa y simulador

8 de noviembre de 2026. El adjunto recibido coincide byte a byte con el encargo original. Se mantiene el plan de diez hitos y su prohibición de abrir sin revisión adecuada.

## Objetivo

Avanzar de una base informativa a funciones reales comprobables: persistencia y consistencia de participación en entorno sintético, privacidad documentada, mapa autonómico oficial y simulador matemático local. Ninguna prueba recoge opiniones reales.

## Archivos y funcionalidades

- `db/migrations/0002_test_participation.sql`: campañas exclusivamente sintéticas, opciones/ámbitos provinciales, tokens, respuestas, credenciales, consentimiento, agregados, rate buckets y versiones de publicación. RLS y permisos PUBLIC cerrados. Check impide `is_test=false`.
- `lib/server/db.ts`, `migrations.ts`, `import-territories.ts`: PostgreSQL desechable `_test`, migraciones con checksum/lock, importación INE por staging y transacción. Integridad y rechazo de cambios de códigos que requieren revisión histórica.
- `crypto.ts`, `participation.ts`: secretos de 256 bits, HMAC con separación de finalidad/campaña, AES-256-GCM con AAD, tokens de 15 min y un uso, consentimiento explícito/versionado, validación provincia-opción, actualización con revisión optimista, retirada transaccional y agregados sin doble cuenta.
- `rate-limit.ts`: contador compartido y atómico por ámbito opaco de pruebas. No es Turnstile ni garantiza unicidad. La integración HTTP/antifraude real está pendiente.
- `lib/results.ts` y `publication.ts`: denominadores explícitos; prototipo sintético con una única publicación nacional al cierre. Bloquea categorías pequeñas, repeticiones, territorios y campañas abiertas. No se considera una solución general de anonimización.
- `/api/participaciones` y sus rutas `/corregir`/`revocar`: contratos cerrados, 423 sin leer cuerpo ni conectar al motor. La web no importa secretos ni clientes PostgreSQL.
- `privacy-gates.ts`, `legal.ts`, `/privacidad`, `docs/privacy/`: contacto facilitado, identidad pendiente y expediente borrador con riesgos, bases candidatas, conservación, operación, consentimiento/derechos y condiciones de apertura. Sin aprobación jurídica ficticia.
- `data/elections/congress-2026.json` y `scripts/import-election-2026.py`: convocatoria y anexo oficiales BOE-A-2026-20742. 52 circunscripciones/350 diputados, sin candidaturas importadas. La información antes pendiente se actualiza en la web.
- `lib/electoral.ts`, `SeatSimulator.tsx`, `/simulador`: modos de cifras/porcentajes, umbral exacto 3% del válido incluido blanco, exclusión de nulo, cocientes BigInt, desempate por total de votos y sorteo manual supuesto/alternancia de dos iguales. Empates múltiples o mayoritarios se detienen sin inventar ganador. Cálculo local, sin fetch, almacenamiento o envío de parámetros.
- `data/cartography/communities-svg.json`, scripts de descarga/preparación, `CommunityMap.tsx`: 19 geometrías oficiales IGN validadas, simplificación por nivel nacional e insets de escala propia; Ceuta/Melilla usan tolerancia más fina. Enlaces/foco/zoom y alternativa textual. Artefacto <400 KB sin comprimir, fuentes SHA-256 y licencia. No es todavía el pipeline multiescala MapLibre/PMTiles.
- `compose.test.yml`, runner y CI: PostgreSQL 17 fijado por digest, loopback y sin volumen para datos sintéticos. Jobs automáticos con servicio PostgreSQL.
- `robots.ts`, `sitemap.ts`, icono y revisión de artefactos: noindex y sitemap vacía mientras las fichas no tengan contenido publicable. No dominio inventado ni exposición de respuestas.

## Pruebas

- 38 pruebas unitarias/de contratos correctas: territorio, cifrado/AAD/tampering, separación de credenciales, puertas cerradas, denominadores, bloqueo de diferencias, convocatoria, reparto legal, porcentajes y mapa.
- PostgreSQL real 17: 13 subcasos correctos (runner reporta 14 incluyendo prueba contenedora). Migraciones dos veces; INE completo importado dos veces; check contra campañas reales; ciphertext y ausencia de secreto; concurrencia/token; corrección; retirada con cascadas; validación y rollback; token caducado; aislamiento pregunta/elección; rate limit concurrente; PUBLIC sin privilegios; publicación cerrada/sintética única.
- Build Next, tipo estricto y revisión de HTML/bundles correctos en las comprobaciones de implementación; la pasada final se registra en `VALIDACION.md`.
- Auditoría npm de producción: sin vulnerabilidades reportadas al consultar; no es prueba de seguridad exhaustiva.
- Geometría: validación de geometrías fuente/simplificadas y marcos, códigos y atribución; revisión visual de una imagen estática del mapa con resvg. Se aumentó precisión de recuadros urbanos tras esa inspección.
- No hay cua_repl.js disponible. No se inició un navegador alternativo ni servidor de preview. La imagen del mapa no es una prueba de las pantallas, teclado o responsive. E2E y WCAG no se dan por superados.

## Incidencias resueltas

El primer runner TypeScript rechazó parameter properties; se sustituyeron por campos explícitos compatibles con strip-only. El primer test del sorteo esperaba mantener la prioridad inicial en un empate posterior; se corrigió el resultado esperado conforme a la alternancia del artículo 163. Un test intentó mutar NODE_ENV readonly en TypeScript; se cambió por un proceso hijo aislado. El primer presupuesto SVG de 150 KB no cabía conservando isletas; se fijó un límite explícito de 400 KB para 19 unidades, manteniendo geometrías en vez de borrarlas silenciosamente. La conversión inicial ImageMagick no tenía su delegate rsvg; se inspeccionó el SVG con resvg en herramientas temporales, sin añadir un navegador.

## Riesgos y límites

El esquema y servicio son de pruebas; no KMS, roles efectivos de aplicación ni panel admin/MFA. No hay verificación de Turnstile ni garantías de persona única. El bloqueo de campaña simplifica consistencia pero requiere medición/optimización de capacidad. No hay pruebas HTTP desplegadas ni carga.

El prototipo nacional no resuelve reconstrucción por homogeneidad/información auxiliar ni permite publicar jerarquía/series. No se conectará a resultados públicos. La EIPD no está aprobada, no hay contratos ni identidad del responsable. Conservación/WAL/backups y solicitudes sin credencial necesitan resolución.

La cartografía es orientativa nacional y simplificada, no delimitación jurídica ni mapa electoral con datos. La instantánea IGN no implica coincidencia temporal perfecta con INE; se verifican códigos autonómicos. Falta pipeline provincia/municipio y pruebas visuales en móvil.

Siguientes pasos detallados: `ESTADO-DEL-PLAN.md`. No hay producción ni recogida pública activas.

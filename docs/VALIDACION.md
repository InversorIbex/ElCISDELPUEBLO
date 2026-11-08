# Validación del Hito 1

8 de noviembre de 2026, Node 24.22.1 / npm 11.9.0.

- `npm test`: 4 pruebas correctas. Verifican cierre de recogida, respuesta real del handler GET y rechazo POST 403, ausencia de llamadas de geolocalización/almacenamiento de opiniones en las pantallas y presencia de avisos/no indexación. Son pruebas unitarias y de invariantes de código; no sustituyen E2E.
- `npm run build`: correcto. Siete páginas de producto más not-found y endpoint de estado generados; comprobación TypeScript incluida. Primer intento detectó TS5097 en importaciones de test; corregido con `allowImportingTsExtensions`, build repetido correctamente.
- `npm run typecheck`: correcto.
- `npm audit --omit=dev --json`: 0 vulnerabilidades reportadas en el momento de ejecución. No demuestra ausencia de vulnerabilidades.
- SQL: no ejecutado. No hay PostgreSQL ni cliente psql disponible. Pendiente prueba de migración y permisos en Hito 2.
- Navegador: no hay herramienta cua_repl.js disponible en el entorno gestionado. Conforme a la habilidad Sites, no se improvisó otro navegador ni se inició servidor de preview. Sin capturas, E2E, comprobación móvil real o auditoría WCAG. CSS responsive y semántica implementados, acabado visual aún pendiente de verificación.
- No se ha medido carga ni concurrencia porque aún no existe motor de respuestas.
- No hay despliegue web ni recogida sensible. Código preparado para ejecutarse localmente mediante README.

## Continuación — Hito 2

Ver `HITO-2.md` para archivos y evidencia. 14 pruebas Node y 4 de importador Python correctas; build/tipos correctos tras incorporar catálogo, selector, fichas y fuentes. Se añade comprobación de HTML prerenderizado y separación de catálogo del JS cliente. No hay pruebas E2E ni conexión PostgreSQL. La fecha y el RD electorales siguen sin verificar.

## Continuación — PostgreSQL, privacidad, cartografía y simulación

38 pruebas de aplicación y 13 subcasos PostgreSQL correctos (14 en el resumen del runner, al incluir la prueba contenedora). Imagen oficial PostgreSQL 17-alpine fijada por digest en un contenedor desechable con puerto loopback; no datos reales. Migraciones 0001/0002 e importación de los 8.132 municipios se han ejecutado y repetido. Auditoría npm de producción sin vulnerabilidades reportadas en esta consulta.

Convocatoria y anexo del RD 806/2026 verificados en BOE: 52 circunscripciones y 350 escaños. Candidaturas sin importar. Mapa de 19 comunidades/ciudades del IGN validado, simplificado y compuesto con recuadros; inspección estática con resvg, no E2E. Los SVG fuente y herramientas de inspección se conservan en work, fuera del repositorio. La comprobación del build se amplía a aviso de simulación, privacidad y atribución del mapa.

Siguen pendientes navegador/E2E, a11y completa, carga, pentest y recuperación de backups, KMS/roles de producción, revisión jurídica y despliegue. Las rutas de recogida siguen cerradas.

Pasada final de la continuación: `npm test` 38/38; integración PostgreSQL 13/13 subcasos (14/14 nodos TAP con contenedor); `npm run build`, `npm run typecheck` y `npm run check:build` correctos. La integración se ha repetido también sobre una base vacía distinta (`cis_pueblo_clean_test`), aplicando las dos migraciones desde cero. La CI remota de este commit se comprobará después de sincronizar el código; no se equipara a pruebas en navegador.

## Continuación — candidaturas, circunscripciones y gráficos

51 pruebas de aplicación correctas y 14 subcasos PostgreSQL (15 nodos TAP con la prueba contenedora). Migraciones 0001–0004 aplicadas y repetidas. La importación de 534 candidaturas se repite sin duplicar. Se comprueba el contenido descifrado mínimo (circunscripción/opción), la ausencia de columna municipal en contadores y el rechazo de códigos municipales en el motor. Sustitución concurrente, retirada, límites y publicación sintética mantienen sus comprobaciones.

Logos: huellas de los 17 archivos locales verificadas, asociaciones y cobertura 161/534 comprobadas, SVG sin elementos activos ni referencias externas. Inspección estática de las imágenes originales realizada en hoja de contacto; no equivale a revisión jurídica de marcas ni del símbolo exacto de cada papeleta.

Resultados oficiales de 2023: 350 diputados en 52 circunscripciones, totales provinciales comprobados. Hemiciclo: 350 puntos únicos en el marco; escenarios parciales no extrapolan y duplicados se rechazan. Cookie futura probada para secreto aleatorio, ruta específica y atributos; endpoints públicos no activados.

Build de producción, TypeScript y comprobaciones de HTML/JS correctos. No se han realizado E2E, revisión móvil real ni auditoría WCAG completa: no hay herramienta de navegador compatible disponible en este entorno Sites. No hay despliegue ni recogida política real. La CI de GitHub se verificará antes de integrar esta continuación.

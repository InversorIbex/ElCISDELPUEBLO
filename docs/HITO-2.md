# Hito 2 — Catálogo oficial y exploración territorial

8 de noviembre de 2026. Función territorial implementada sobre JSON versionado en servidor. Integración PostgreSQL pendiente. Recogida de opiniones cerrada.

## Objetivo

Transformar el territorio en navegación real: buscar manualmente cualquier municipio de la relación oficial INE 2026, validar sus códigos y relaciones y abrir sus fichas. Sin geolocalización ni inferencia de residencia.

## Fuentes verificadas

Página del INE: https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177031&menu=ultiDatos&idp=1254734710990

La página identifica la relación a 1 de enero de 2026 y enlaza los archivos usados:

- https://www.ine.es/daco/daco42/codmun/26codmun.xlsx
- https://www.ine.es/daco/daco42/codmun/cod_ccaa_provincia.htm
- https://www.ine.es/daco/daco42/codmun/cod_num_muni_provincia_ccaa.htm

El archivo XLSX tiene una hoja por código provincial. La importación valida cabeceras, versión, 5 dígitos en código municipal, provincia indicada en cada hoja, unicidad, relación provincia-comunidad y recuentos. La tabla oficial de recuentos coincide: 8.132 municipios, 52 códigos provinciales, 19 comunidades/ciudades. No se confunden estas últimas con 19 comunidades autónomas: son 17 comunidades y 2 ciudades autónomas.

Se conserva fecha y SHA-256 de cada descarga en el catálogo. `fetch-ine.py` verifica las huellas antes de aceptar nuevas descargas. No hay sincronización de modificaciones posteriores al 1/1/2026. La comprobación inicial de URL localizó los enlaces desde la página de la operación: el fichero vigente está directamente en `codmun/`, no en `codmun26/`.

## Licencia

Aviso legal consultado: https://www.ine.es/dyngs/AYU/index.htm?cid=125
Establece CC BY 4.0 como licencia general de información estadística del INE, salvo excepciones. Se muestra atribución, fecha de la relación, transformaciones y ausencia de respaldo del INE. No se copian logos ni identidad del organismo. No se extiende esta comprobación a la cartografía pendiente.

## Archivos y funciones

- `data/territories/ine-2026.json`: catálogo completo persistido en el repositorio, servido desde el servidor, sin contenido de opinión.
- `aliases.json`: variantes comunes editoriales, separadas de los nombres oficiales. No es inventario exhaustivo de alias lingüísticos/históricos.
- `scripts/import-ine.py`: validación previa y reemplazo atómico de catálogo; falla sin tocar la versión anterior.
- `scripts/fetch-ine.py`, `requirements-data.txt` y `test-import-ine.py`: reproducción y pruebas de rechazo.
- `lib/territories.ts`: índice, filtros, búsqueda Unicode, ranking exacto/prefijo/parcial, códigos y rutas únicas.
- `lib/territory-format.ts`: formato compartido sin importar el catálogo en cliente.
- `app/api/territorios`: consulta acotada a 20 resultados o lista de una provincia, filtros validados, cache de datos públicos.
- `components/TerritorySelector.tsx`: buscador con teclado/listbox, jerarquía, estados de error/carga, cancelación de peticiones y selección explícita. Sin almacenamiento persistente de selección.
- `components/TerritoryPage.tsx` y rutas `/espana`, `/comunidad/[slug]`, `/provincia/[slug]`, `/municipio/[code]/[slug]`: directorios/fichas, breadcrumbs, metadatos únicos, 404 de códigos inexistentes y redirección a slug correcto.
- Portada, explorador y participación integran el selector. `/fuentes` permite revisar trazabilidad.
- `.github/workflows/validate.yml`: CI de pruebas, build, tipos y comprobación de artefactos; ejecución remota pendiente de confirmar.

## Pruebas y resultados

- `npm test`: 14 correctas (10 nuevas de territorios), incluyendo todos los códigos, integridad, alias, rutas, filtros y handlers API.
- `python3 scripts/test-import-ine.py --source-dir /workspace/work/ine`: 4 correctas. Importación oficial válida, rechazo de duplicados, versión incorrecta y total inconsistente; los fallos preservan la versión anterior.
- `npm run build` y `npm run typecheck`: correctos con todas las rutas añadidas.
- `npm run check:build`: comprueba controles del selector y enlaces en HTML prerenderizado y ausencia de catálogo completo en JavaScript cliente. El primer intento detectó que Intl no agrupaba cifras de cuatro dígitos en es-ES; corregido especificando `useGrouping: 'always'`.
- Navegador: sin herramienta cua_repl.js disponible en este entorno; conforme al flujo Sites no se improvisa una alternativa. No se declaran E2E, pruebas de teclado en navegador ni auditoría visual ejecutadas. La semántica implementada no garantiza conformidad WCAG sin pruebas.
- PostgreSQL: sin instancia conectada; no se ha aplicado ni probado la migración SQL del primer hito.

## Riesgos y siguientes pasos

El catálogo es una instantánea oficial, no la situación registral actual al minuto. Antes de uso público, revisar modificaciones posteriores y la política de actualización/históricos. El JSON no sustituye al diseño de importación transaccional PostgreSQL, necesario antes de relacionar respuestas. La búsqueda pública es de solo lectura; antes de carga real aplicar presupuestos/rate limiting en borde y medir abuso de consultas variables.

La navegación no crea opiniones ni guarda residencia. No se ofrece recordar municipio en un identificador persistente hasta evaluar impacto. Las fichas no publican agregados y siguen noindex para evitar indexar miles de páginas vacías.

Próximo: Hito 3 (decisiones de privacidad, EIPD/revisión jurídica y diseño detallado de consentimiento/retirada) y prueba de migraciones territoriales en PostgreSQL. Después, motor de participación en servidor con pruebas de concurrencia; todavía no habilitado. Mapa real IGN/CNIG permanece pendiente del Hito 6.

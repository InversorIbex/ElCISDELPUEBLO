# Candidaturas, circunscripciones y gráficos

Revisión: 8 de noviembre de 2026. Desarrollo sin respuestas políticas reales.

## Catálogo del Congreso

534 candidaturas proclamadas en 52 circunscripciones. Se excluyen 21 no proclamadas; no se importan opciones del Senado ni nombres personales. Fuente: [BOE-A-2026-23103](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103), con dos denominaciones del Congreso corregidas según [BOE-A-2026-23383](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23383). Se conserva orden, provincia, referencia, huella y edición. Instantánea, no actualización automática ni activación de una campaña.

`/candidaturas?provincia=27` y `/api/candidaturas?provincia=27` muestran exclusivamente las opciones de esa provincia. La migración 0003 y el importador de laboratorio separan el registro oficial de las opciones sintéticas de los tests. No se conectan automáticamente a campañas abiertas.

Reproducir: guardar ambos HTML oficiales como `proclaimed.html` y `corrections.html` en un directorio de trabajo; ejecutar `python3 scripts/import-congress-candidacies.py --source-dir RUTA`. El importador rechaza recuentos/estructuras distintos; los cambios requieren revisión.

## Logos: trabajo incompleto

17 imágenes identificativas obtenidas de webs oficiales de las formaciones y revisadas visualmente; asociaciones exactas cubren 161 candidaturas. Quedan 373 sin logo verificado. Todas las candidaturas aparecen aunque les falte imagen. No se generan logos ni se atribuye a una coalición la marca de un componente sin revisión. La identidad del sitio de una formación no certifica el símbolo registrado de todas sus papeletas.

Los archivos locales y `data/candidacies/logos.json` conservan enlaces originales, huellas SHA-256, fecha, transformación y derechos. Los logos no quedan cubiertos por la licencia de los datos INE/IGN. Tres SVG se revisan también contra contenido activo y referencias externas.

El enlace del INE a papeletas conduce a `https://29neleccionesgenerales.es/papeletas-descargables/`, que respondió HTTP 403 durante esta revisión. Varias webs de formaciones también rechazan la descarga o devuelven una página de protección. El PDF de proclamación no contiene los símbolos de las candidaturas. Hace falta un paquete oficial accesible o revisión adicional de cada fuente para completar los logos; no se declara este requisito terminado.

## Respuesta dentro de una circunscripción

Para el Congreso basta elegir manualmente una circunscripción. El motor de laboratorio recibe y cifra solo `provinceCode` y `optionId`; sus contadores son provinciales. No exige ni deriva un municipio, GPS, geolocalización IP o identificador de hardware. El directorio municipal sigue siendo una herramienta de consulta independiente.

La migración 0004 reduce los contadores al nivel provincial. Aborta si encuentra respuestas o contadores anteriores: requiere revisar el laboratorio antes de reinterpretar información cifrada. No borra ni convierte silenciosamente respuestas existentes.

La credencial aleatoria de 256 bits es específica del sondeo y del navegador. El contrato de cookie futuro tiene HttpOnly, Secure, SameSite=Strict y ruta específica del sondeo. Por defecto es de sesión; recordar durante 30 días sería una opción explícita pendiente de política de conservación aprobada. El servidor guarda HMAC de la credencial, nunca un ID físico. Borrar datos o usar otro navegador/dispositivo permite obtener otra credencial; no se garantiza una persona ni un dispositivo por respuesta.

Sustituir resta el cómputo anterior y suma el nuevo en una transacción; permite corregir también la circunscripción, siempre que la opción exista allí. La revisión optimista rechaza cambios concurrentes obsoletos. Retirar elimina respuesta, credencial y consentimiento y resta el contador. No se conserva historial individual de opciones.

El contrato de cookie no está conectado a rutas públicas: siguen devolviendo 423 sin leer contenido, emitir cookies ni guardar opiniones. Responsable formal, revisión jurídica, seguridad y publicación segura siguen pendientes.

## Gráficos y escaños

`/simulador` calcula D’Hondt por provincia con el reparto de 2026; Ceuta y Melilla usan mayoría. Se pueden añadir o sustituir provincias en un escenario nacional: las no introducidas quedan grises, sin extrapolación ni reparto nacional único. Las alternativas A–L son hipótesis manuales y deben usarse de forma consistente entre provincias.

Hemiciclo de 350 puntos, leyenda textual y cobertura explícita. Comparación con [resultados oficiales de 2023, BOE-A-2023-18907](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907): 52 circunscripciones, 350 diputados y 12 denominaciones con escaños. PSOE y PSC separados como en el BOE. No representa los grupos parlamentarios al final de la legislatura ni establece equivalencias automáticas con A/B.

Pueden guardarse hasta 12 puntos de escenarios manuales para dibujar evolución, con tabla accesible y advertencia sobre cambios de cobertura. Todo queda en memoria de la página y se pierde al recargar; no se transmite ni se guarda como opinión. Esta curva no es una evolución real del sondeo. `/tendencias` continúa sin datos inventados: las series reales y estimaciones sobre respuestas necesitan cobertura suficiente, ventanas y política contra reconstrucción revisada.

Reproducir histórico: descargar HTML oficial y ejecutar `python3 scripts/import-congress-results-2023.py --source RUTA`. Se comprueban totales nacionales y provinciales. Cada elección conserva su propio reparto de escaños.

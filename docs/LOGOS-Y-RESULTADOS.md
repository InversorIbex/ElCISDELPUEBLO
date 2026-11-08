# EL PUEBLO OPINA — identidad gráfica y resultados públicos

## Logotipos

La aplicación **no debe crear ni reconstruir** símbolos electorales, ni utilizar el logo de un partido para una coalición sin verificar esa asociación. Los 17 archivos existentes y sus fuentes están en `data/candidacies/logos.json`, asociados por el nombre oficial de la candidatura en `data/candidacies/logo-associations.json`. Toda candidatura sin logo mantiene su **nombre oficial y acceso al BOE**; un guion indica que falta archivo, no que el partido carezca de símbolo.

Para cada logo nuevo: verificar identidad gráfica y su vigencia en una fuente primaria (formación o papeleta oficial); registrar URL de página y URL del archivo, fecha, permisos, huella SHA-256 y candidatura(s) exacta(s); revisar SVG antes de incluirlos; probar legibilidad en móvil. No utilizar búsquedas por parecido como evidencia de identidad.

## Publicaciones provinciales

`components/CandidacyResults.tsx` ya tiene la presentación responsive de las candidaturas, nombre, logo, barra y porcentaje, sin datos ficticios. Lee únicamente instantáneas de `data/results/approved-provincial.json` a través de `lib/published-provincial.ts`. El archivo empieza vacío y **no autoriza por sí solo** una publicación: requiere revisión legal, seguridad, anonimización y aprobación de la política de publicación, que actualmente solo contempla una única publicación nacional tras el cierre.

Para habilitar publicaciones provinciales: modificar formalmente el modelo de privacidad, documentar el riesgo de inferencia por actualizaciones y segmentos pequeños, auditar registros/procesos y registrar una aprobación real. Una nueva instantánea no debe contener votos individuales, identificadores, direcciones IP ni respuestas de muestra pequeña. El código rechaza datos inconsistentes o celdas positivas inferiores a 50 como comprobación adicional; esto no garantiza por sí solo anonimato.

Los porcentajes se calculan como 100 * votos válidos de candidatura / total de respuestas válidas a candidaturas de la circunscripción. Mostrar también el total de respuestas y separar voto en blanco, no respuesta y otras categorías cuando sean publicables. Nunca representar una publicación ausente como 0 %.

**La recogida pública sigue cerrada**; no activar producción modificando exclusivamente un flag.

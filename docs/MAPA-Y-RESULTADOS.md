# Selección territorial y resultados

La portada y `/participar` incluyen mapa autonómico con enlaces a las circunscripciones. Selección en dos pasos: comunidad y provincia/ciudad autónoma. La lista permite usar el flujo sin ratón ni mapa. No es geolocalización y no requiere municipio. Cada mapa conserva atribución IGN y recuadros con escala propia.

`/participar?comunidad=12` limita la lista a Galicia; `/participar?provincia=27#papeleta` presenta las candidaturas proclamadas de Lugo y sus imágenes verificadas disponibles. Todas las candidaturas aparecen aunque les falte logo. El mapa no se presenta como cartografía provincial.

`/resultados?provincia=27` conserva el ámbito al navegar desde las candidaturas. Se distinguen dos bloques: sondeo sin publicación y escaños oficiales de 2023. El histórico nunca se presenta como votos recibidos en esta web ni como estimación actual; no se inventan ceros o porcentajes. Referencia nacional disponible sin provincia. Las tablas conservan fuente y reparto de la elección de 2023.

Nombre público actualizado a Inversor_Ibex por petición del promotor. Un alias público no completa por sí solo la identificación legal del responsable. No se reescribe el historial de commits anteriores.

## Votos reales: bloqueo material

No existe conexión accesible a una base de producción ni permisos de administración de Vercel en esta sesión. El único motor implementado está protegido para campañas sintéticas y bases `_test`; no se conecta a la web pública. No hay almacenamiento persistente compartido de votos, credenciales de despliegue de ese servicio ni aprobación de las puertas jurídicas y de seguridad. Los endpoints siguen cerrados.

No sustituir esto por memoria de la función serverless, disco temporal, datos del navegador o votos inventados: no producen resultados compartidos fiables. Antes de abrir hace falta configurar el servicio persistente en Vercel y completar el motor de producción, claves/roles, límites, consentimiento, corrección/retirada, publicación segura y revisiones documentadas. No pegar secretos en GitHub ni en el chat.

# EL PUEBLO OPINA — Auditoría de Neon y preparación de lanzamiento
**Fecha:** 2026-11-08 · **Estatus:** catálogos públicos inicializados; recogida real de votos CERRADA.

## Infraestructura comprobada
- Vercel proyecto `elcisdelpueblo`, variables de conexión PostgreSQL presentes en Production/Preview (no se muestran secretos).
- Neon proyecto `neon-aqua-nest` en Frankfurt, PostgreSQL 18.6, base `neondb`.
- La conexión SQL en Neon respondió correctamente.
- Inicialmente `neondb` NO tenía tablas de la aplicación.
- Se creó una rama de ensayo separada `el-pueblo-opina-prelaunch-validation`. Allí se aplicaron las migraciones 0001 a 0004 y una escritura exclusivamente sintética (campaña, opción, papeleta, credencial, consentimiento y contador). Se leyó y se comprobó 1 registro por entidad y 0 campañas no sintéticas.
- En producción solo se aplicaron las migraciones **0001 y 0003**: `reference` y registro de `catalog`. No hay esquemas privados de votos en producción.
- Se importaron **19 comunidades/ciudades**, **52 circunscripciones** y **534 candidaturas** de los archivos ya revisados en GitHub. Las 534 candidaturas cubren las 52 circunscripciones; 0 referencias provinciales inválidas.
- 0 tablas `reference`/`catalog` sin RLS y 0 concesiones a `PUBLIC`.
- Un endpoint de prueba en la rama de GitHub `feature/verified-neon-catalog` leyó por HTTPS desde Vercel los 19/52/534 registros y respondió `ready:true`, `participation:closed`. **Después** se cambió dicho endpoint para requerir una URL de catálogo con rol de solo lectura; no fusionar ni desplegar la versión final sin crearla.
- La política actual de `/api/participaciones` sigue denegando todos los POST de votos con HTTP 423.

## Riesgos pendientes y bloqueos de apertura pública
1. **Rol de mínimo privilegio:** las variables actuales de conexión corresponden al propietario `neondb_owner`. Crear un rol con SELECT únicamente para catálogo y la variable privada `CATALOG_READONLY_DATABASE_URL`; credenciales separadas para escritura transaccional. No utilizar el propietario para tráfico público.
2. **Datos de opinión política:** revisión RGPD art. 6 y art. 9; consentimiento explícito, información transparente, identidad del responsable, retirada y procedimiento de derechos. Una EIPD y evaluación de riesgos antes de habilitar el tratamiento. La AEPD reconoce las opiniones políticas como categoría especial.
3. **Antifraude:** probar en PostgreSQL real el servicio de votos con HMAC e idempotencia, concurrencia, validación de candidatura provincial, IP obtenida de proveedor confiable y antibots (ej. Turnstile). El servidor NO conoce un ID estable físico de un móvil: el límite de 1 es por navegador persistente y campaña, no por hardware. 2 votos/IP/día puede perjudicar redes compartidas.
4. **Aislamiento y seguridad:** claves cifradas y rotación, permisos separados, análisis de dependencias, cabeceras, logs sin datos de voto, retención/borrado de identificadores, respaldo/restauración ensayados.
5. **Resultados:** política formal de agregación, retraso de publicación y umbrales por circunscripción frente a ataques de diferencias; no confundir sondeo no representativo con pronóstico electoral.
6. **Coste:** Neon indicaba límite de cómputo 0.25 CU en el proyecto asociado, auto-suspensión fijada en 0 segundos y retención histórica 6 horas; verificar plan, coste y alertas de presupuesto antes de abrir. Crear ramas adicionales puede repercutir en cuotas.
7. **Producción:** verificar y proteger la rama principal Neon, revisar accesibilidad, observabilidad y despliegue E2E con usuario de mínimos privilegios antes de eliminar el bloqueo HTTP 423.

## Fuentes regulatorias de revisión
- https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/5-bases-legitimadoras-del-tratamiento/FAQ-0215-cuales-son-las-bases-de-legitimacion-para-el-tratamiento-de-las-categorias-especiales-de-datos
- https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/5-bases-legitimadoras-del-tratamiento/FAQ-0211-segun-el-rgpd-como-debe-solicitarse-el-consentimiento-de-los-interesados-para-tratar-sus-datos-personales
- https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/10-evaluacion-de-impacto/FAQ-0229-que-debe-incluir-una-evaluacion-de-impacto-de-proteccion-de-datos

## Decisión técnica actual
**Catálogo operativo en Neon. Votación pública no autorizada.** No crear credenciales de voto, modificar `launchStatus()` a `enabled:true` ni ejecutar el borrador `db/drafts/public_vote.sql` en producción antes de completar las aprobaciones y tests.

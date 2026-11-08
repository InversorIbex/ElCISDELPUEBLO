# Votación web: conexión de papeletas a PostgreSQL (2026-11-08)

## Implementado
- Nueva API POST `/api/participaciones` con validación de candidatura por provincia, origen, body, consentimiento, Turnstile con validación del servidor, cookie de sesión anónima HttpOnly, IP de proxy y transacción PostgreSQL atómica.
- Endpoint `/api/vote-session` crea la credencial sólo cuando todas las condiciones de lanzamiento estén aprobadas.
- Papeleta visual conectada: nunca muestra éxito sin HTTP 200 y `recorded:true` confirmado por PostgreSQL.
- Control por IP: 2 aceptados por día civil en zona Europe/Madrid; por credencial de navegador en ordenador: máximo 2 diarios; por navegador móvil: máximo 1 en toda la campaña. El modo se infiere del User-Agent, **no identifica hardware**.
- PostgreSQL `poll_private` creado en la rama main de Neon, cinco tablas con RLS y claves foráneas de candidata-circunscripción; **0 votos reales y 0 contadores al crear el esquema**.
- Rol dedicado `epov_vote_writer` limitado a `poll_private`; se configuraron en Vercel variables sensibles `VOTE_DATABASE_URL` y `VOTE_HMAC_SECRET` de producción sin publicar secretos.
- La aprobación del tratamiento político no se deduce de haber creado las tablas.

## Verificaciones realizadas
- Se verificó en Neon que las restricciones rechazan celdas fuera de provincia, contador >2, segundo navegador móvil e idempotencia duplicada.
- Se realizaron 3 escrituras simultáneas del mismo contador SQL en rama aislada: 2 permitidas y 1 denegada.
- El build en Vercel de la rama actual pasó. GET /api/participaciones devolvió `enabled:false` y la página /participar cargó.
- **Aún no se ha probado una transacción de voto HTTP de navegador a producción** ni la integración completa Turnstile.

## Controles para abrir (obligatorios)
La aplicación sigue cerrada si falta cualquier variable:
- `VOTE_PUBLIC_ENABLED=true`
- `VOTE_PRIVACY_APPROVED=true` y revisión RGPD artículos 6/9, identidad del responsable, EIPD y consentimiento explícito
- `VOTE_SECURITY_APPROVED=true` tras auditoría de cookies, IP, CSRF y prueba HTTP de extremo a extremo
- `VOTE_RETENTION_APPROVED=true` tras definir borrado de logs y contadores
- `VOTE_BALLOTS_APPROVED=true` tras verificar candidaturas y vigencia
- `VOTE_RESULTS_POLICY_APPROVED=true` tras acordar la publicación agregada
- `VOTE_ALLOWED_HOSTNAME` con el dominio público definitivo
- `TURNSTILE_SECRET_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY` de Cloudflare Turnstile configurados y verificados

**No establecer flags de aprobación sin revisiones reales.** La base de producción no tiene datos de votos reales. El endpoint sigue devolviendo HTTP 423 mientras falte alguna puerta.

## Próximas comprobaciones
- Prueba E2E en staging con sitekey Turnstile de pruebas + credenciales staging, primero con registros sintéticos.
- Verificar que Vercel proporciona una única IP de cliente fiable y no es posible suplantarla.
- Prueba real de escritura con rol mínimo, rollback, fallos intermitentes y reconexión; no usar una clave de propietario de DB.
- Comprobación legal y privacidad independiente de la EIPD; registro de consentimiento y plazo de supresión.
- Resultados públicos agregados: evitar ataques por diferencia, tamaño mínimo y comparaciones de muestras pequeñas.
- Alertas de gasto Vercel/Neon y rate limiting de transporte antes de publicar.

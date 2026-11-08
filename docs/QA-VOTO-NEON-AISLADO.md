# EL PUEBLO OPINA — prueba de escritura transaccional · 8 noviembre 2026

## Entorno utilizado
Neon proyecto `neon-aqua-nest` (`cool-dust-36009292`), rama aislada `el-pueblo-opina-prelaunch-validation` (`br-empty-resonance-bad2umx8`). **No se han creado tablas de voto en Neon main ni habilitado POST público.**

## Resultado
- El borrador `db/drafts/public_vote.sql` pasó **15 sentencias SQL** de manera transaccional en la rama aislada, ampliadas con clave foránea compuesta de candidatura/provincia.
- Inserción sintética de papeleta de Lugo: aceptada.
- Candidatura de Lugo con provincia Madrid: **rechazada por la FK**.
- Contador de IP con 3 votos admitidos: **rechazado por CHECK (<= 2)**.
- Segunda credencial móvil idéntica: **rechazada por la PK**.
- Idempotencia duplicada: **rechazada por la PK**.
- Todas las tablas de voto en esta prueba usan RLS y permisos `PUBLIC` revocados por el borrador.
- Las comprobaciones de los límites 2/IP/día, 1/navegador móvil/campaña y 2/navegador PC/día están implementadas en `lib/server/public-vote.ts`.
- Se añadió `tests/integration/public-vote.test.ts` para cuotas, idempotencia y 3 peticiones concurrentes contra Neon. **Esta suite automatizada todavía NO se ha ejecutado**, ya que requiere configurar credenciales específicas de la rama aislada en un entorno de ejecución seguro.

## Ejecución de pruebas automatizadas (exclusivamente rama aislada)
1. Obtener un string de conexión **a la rama de ensayo**, nunca a `main`.
2. Establecer `TEST_VOTE_DATABASE_URL` con esa conexión, `TEST_DB_BRANCH_NAME=el-pueblo-opina-prelaunch-validation` y `TEST_VOTE_HMAC_SECRET` aleatorio (>=32 caracteres).
3. Ejecutar: `node --experimental-strip-types --test tests/integration/public-vote.test.ts`.
4. Comprobar también cortes de conexión, reinicios durante COMMIT, TTL de contadores y máxima concurrencia.

**Advertencia:** la variable `TEST_DB_BRANCH_NAME` es solo una barrera adicional y no verifica criptográficamente qué branch recibe las solicitudes. Hay que confirmar el endpoint realmente conectado a la rama antes de ejecutar.

## Pendientes para abrir al público
- Validar una base legal adecuada para datos de opinión política, transparencia, responsable, EIPD, retención y revocación.
- Diseño final de secreto HttpOnly/credencial de navegador y protección de consentimientos.
- Verificación Turnstile server-side, detección de IP únicamente en cabeceras de origen confiable, prevención CSRF y protección de agentes automatizados.
- Roles SQL de mínimos privilegios; no usar el propietario de Neon en funciones de petición pública.
- Pruebas automatizadas reales de concurrencia y resiliencia.
- Política revisada de agregación, supresión de celdas pequeñas y publicación de resultados por provincia. No publicar cambios de una respuesta que puedan inferir preferencias individuales.
- Separar claramente pruebas de resultados reales. La web debe continuar respondiendo HTTP 423 hasta completar estos controles.

# Política técnica de conservación de datos antifraude (opción B)
Fecha de decisión: 2026-11-08. Responsable declarado: Inversor Ibex (LETRIXA LABS).

## Tratamiento real
- No se almacenan IP literales en `poll_private`. Para los límites de dos votos por IP y día se emplea un HMAC-SHA256 con clave privada, fecha civil de Madrid y finalidad `ip`. Ese valor sigue siendo dato seudonimizado.
- `ip_daily` y `browser_daily`: retención limitada al día civil **actual** de Europe/Madrid. Un proceso diario elimina días anteriores; los registros vencidos podrían permanecer hasta la siguiente ejecución y hay que supervisarla.
- `idempotency`: digest de solicitud conservado hasta 48 horas, para permitir detectar reintentos de la misma solicitud.
- `mobile_lifetime`: digest de navegador móvil necesario para limitar a una participación por campaña. **No tiene plazo de borrado automatizado todavía**: debe definirse una fecha de fin de campaña, un procedimiento de eliminación y pruebas antes de activar votos reales.
- `ballots`: respuestas individuales sin IP, cookie ni identificador personal directo. El plazo de conservación y la retirada de consentimiento siguen **pendientes de revisión**; NO se borran con la limpieza antifraude.

## Borrado automático preparado
`GET /api/cron/vote-retention`:
1. Requiere `Authorization: Bearer $CRON_SECRET`; secreto de al menos 32 caracteres.
2. Solo funciona en producción y con `VOTE_CLEANUP_DATABASE_URL`, credencial **separada** con `DELETE` únicamente sobre `poll_private.ip_daily`, `poll_private.browser_daily` y `poll_private.idempotency`. Nunca sobre `ballots` ni `mobile_lifetime`.
3. Debe invocarse diariamente con un cron externo (Vercel Cron, después de configurar variables). La limpieza es transaccional e idempotente y devuelve conteos sin valores de hash.
4. Una ejecución diaria no garantiza retención exacta de 24 horas; como máximo mantiene filas de días anteriores hasta la siguiente ejecución correcta. Monitorizar fallos y alertas.
5. Evitar `pg_cron` en Neon si el compute tiene escala a cero; su scheduler podría no ejecutarse durante la suspensión.

**Estado:** código y política preparados, pero NO se debe afirmar que la limpieza esté activa hasta comprobar credenciales, calendario y ejecución real. La aprobación `VOTE_RETENTION_APPROVED` debe permanecer desactivada hasta completar también el borrado móvil, retiradas, copias de seguridad y logs de proxy.

## Comprobación segura de SQL en staging
Crear registros sintéticos de fechas anteriores (nunca votos reales). Invocar el proceso autenticado en una base de staging con configuración equivalente; verificar que desaparecen solo los contadores vencidos y los reintentos >48h, mientras sobreviven las papeletas y marcadores móviles. No borrar producción para probar.

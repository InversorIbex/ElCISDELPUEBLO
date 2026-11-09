# Votación ciudadana en producción

## Estado (2026-11-09)
- **Base de datos:** Supabase, región UE (Frankfurt), proyecto `uxoeghnhszqdhiqhzcvu`. Esquema `db/migrations/0001…0005` aplicado, con 52 provincias, 8.132 municipios y 534 candidaturas proclamadas. `0005_live_vote.sql` sustituye a `db/drafts/public_vote.sql`.
- **Preparar o actualizar la base:** `VOTE_DATABASE_URL=… node --experimental-strip-types scripts/setup-vote-db.ts --confirmo-produccion` (idempotente).
- **Conexión:** `lib/server/vote-db.ts`, con TLS verificado contra la CA raíz de Supabase (`lib/server/supabase-ca.ts`).
- **Resultados en vivo:** `/api/resultados-en-vivo` (caché de 10 s en la CDN). Incluye mapa coloreado, votos y porcentajes por circunscripción, hemiciclo D'Hondt y contador de votos en la franja superior. Las reglas están en `lib/live-results.ts`:
  - **Desde el primer voto** (decisión del promotor, 2026-11-09). `RESULTS_MIN_COUNT` permite volver a exigir un mínimo; con más de 1 se aplican también supresión complementaria y dominancia del 95 %.
  - **Riesgo aceptado:** con muy pocos votos en una provincia, alguien que sepa que otra persona acaba de votar allí podría deducir su voto. Debe constar en la EIPD.
  - **Veda LOREG**: no se devuelve nada del 24-N 00:00 al 29-N 21:00.
- **Sin votos simulados:** el simulador se retiró el 2026-11-09 y los resultados leen solo votos reales (`NOT simulated`).

## Variables en Vercel (Production)
| Variable | Valor |
|---|---|
| `VOTE_DATABASE_URL` | Supabase → Connect → **Transaction pooler** (puerto 6543), con la contraseña de la base |
| `VOTE_HMAC_SECRET` | ≥ 32 caracteres aleatorios (no cambiar durante la campaña) |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile, widget para `www.laopiniondelpueblo.eu` |
| `VOTE_ALLOWED_HOSTNAME` | `www.laopiniondelpueblo.eu` |
| `VOTE_PUBLIC_ENABLED`, `VOTE_PRIVACY_APPROVED`, `VOTE_SECURITY_APPROVED`, `VOTE_RETENTION_APPROVED`, `VOTE_BALLOTS_APPROVED`, `VOTE_RESULTS_POLICY_APPROVED` | `true`, cada una cuando el promotor acepte esa garantía. Mientras falte alguna, la votación sigue cerrada (423) |
| `VOTE_CLEANUP_DATABASE_URL` | la misma cadena (limpieza de huellas de IP vencidas) |
| `CRON_SECRET` | ≥ 32 caracteres (limpieza de huellas de IP) |
| `RESULTS_MIN_COUNT` | opcional; por defecto 1 |

## Política solicitada por el promotor
- **Regla vigente (2026-11-09):** máximo **2 votos aceptados por IP en cualquier ventana de 1 hora (antes 5 h)** (deslizante, `poll_private.ip_window`, purgada al vencer) y **1 voto por credencial anónima de navegador en toda la campaña** (`poll_private.browser_lifetime`). Ambos se guardan solo como HMAC.
- **Veda electoral (LOREG art. 69.7):** `lib/electoral-blackout.ts` impide en servidor devolver resultados del sondeo del 24-N 00:00 al 29-N 21:00 (hora peninsular). La votación sigue abierta.
- La web **no obtiene un ID permanente real de un teléfono**. El navegador puede borrar cookies; el User-Agent se puede falsificar; una IP puede pertenecer a varias personas. Por tanto, estos límites son *mitigaciones*, no garantías de identidad individual. No implementar fingerprinting invasivo como sustituto.
- Los contadores de IP y navegador se almacenarán como HMAC con clave privada; nunca la IP literal. El voto se guarda separado de dichos contadores.
- Detección de IP únicamente desde proveedor de proxy confiable y configuración verificada; no aceptar arbitrariamente `X-Forwarded-For` del cliente.
- Aprobación jurídica: tratamiento de opinión política (RGPD art. 9), identidad del responsable, fundamento, consentimiento explícito, EIPD y borrado probados.
- Antes de abrir: Turnstile con verificación server-side, CSRF/origen, credencial secreta HttpOnly SameSite, idempotencia, límites transaccionales, protección contra bots, comprobación de amenazas, TTL de IP digests, backups cifrados, control de errores, prueba de carga y auditoría.
- Publicación (decisión del promotor, 2026-11-09): resultados en tiempo real por circunscripción desde el primer voto, con veda LOREG. Riesgo residual: con recuentos pequeños y publicación continua, comparar dos lecturas consecutivas puede revelar el voto de una persona concreta. Queda documentado para la revisión jurídica y de privacidad.

## Pendiente para pasar a producción
Conectar un endpoint autenticado y comprobado, habilitar infraestructura PostgreSQL con credenciales de mínimo privilegio, validar conectividad de base real y cumplimiento de todos los hitos `lib/server/privacy-gates.ts`. Solo entonces sustituir la respuesta HTTP 423 por el servicio de producción.

## Logotipos
La cobertura de asociación por denominación ha aumentado con fuentes verificadas de Wikimedia Commons, pero sus marcas no acreditan el símbolo específico de la papeleta de una coalición. El proxy `/api/party-logo/[id]` únicamente devuelve miniaturas rasterizadas de un listado cerrado y rechaza tipos inesperados; comprobar la respuesta HTTP y visualmente cada archivo antes de fusionar.

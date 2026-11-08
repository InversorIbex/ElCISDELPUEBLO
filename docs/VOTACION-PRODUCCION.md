# Preparación del almacenamiento de votos — NO PUBLICADO
## Estado
La página pública sigue rechazando POST en `/api/participaciones` con 423; los cambios de esta rama no han activado el servicio. `lib/server/public-vote.ts` es la capa transaccional preparada para una futura integración, con SQL de revisión en `db/drafts/public_vote.sql`. **Ese SQL no pertenece al flujo automático de migraciones y no se ha aplicado a producción.**

## Política solicitada por el promotor
- Ordenador: máximo **2 votos aceptados por IP y día de calendario de Madrid** y máximo 2 por credencial de navegador y día.
- Navegador móvil: **1 voto por credencial anónima persistente y campaña**, además de máximo 2 por IP y día.
- La web **no obtiene un ID permanente real de un teléfono**. El navegador puede borrar cookies; el User-Agent se puede falsificar; una IP puede pertenecer a varias personas. Por tanto, estos límites son *mitigaciones*, no garantías de identidad individual. No implementar fingerprinting invasivo como sustituto.
- Los contadores de IP y navegador se almacenarán como HMAC con clave privada; nunca la IP literal. El voto se guarda separado de dichos contadores.
- Detección de IP únicamente desde proveedor de proxy confiable y configuración verificada; no aceptar arbitrariamente `X-Forwarded-For` del cliente.
- Aprobación jurídica: tratamiento de opinión política (RGPD art. 9), identidad del responsable, fundamento, consentimiento explícito, EIPD y borrado probados.
- Antes de abrir: Turnstile con verificación server-side, CSRF/origen, credencial secreta HttpOnly SameSite, idempotencia, límites transaccionales, protección contra bots, comprobación de amenazas, TTL de IP digests, backups cifrados, control de errores, prueba de carga y auditoría.
- Publicación: el resultado en tiempo real por provincia no se habilitará hasta aprobar un diseño de privacidad resistente a ataques por diferencias. La política actual solo permite publicación nacional al cierre. El usuario puede ver siempre las candidaturas, no resultados inventados.

## Pendiente para pasar a producción
Conectar un endpoint autenticado y comprobado, habilitar infraestructura PostgreSQL con credenciales de mínimo privilegio, validar conectividad de base real y cumplimiento de todos los hitos `lib/server/privacy-gates.ts`. Solo entonces sustituir la respuesta HTTP 423 por el servicio de producción.

## Logotipos
La cobertura de asociación por denominación ha aumentado con fuentes verificadas de Wikimedia Commons, pero sus marcas no acreditan el símbolo específico de la papeleta de una coalición. El proxy `/api/party-logo/[id]` únicamente devuelve miniaturas rasterizadas de un listado cerrado y rechaza tipos inesperados; comprobar la respuesta HTTP y visualmente cada archivo antes de fusionar.

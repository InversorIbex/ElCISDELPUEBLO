# El CIS del Pueblo — Arquitectura v0.1

Estado: Hito 1, 8 de noviembre de 2026. Entorno local de desarrollo; sin publicación, sin recogida sensible. No se declara preparado para producción.

## Inspección y alcance
El workspace no contenía código de producto, package.json ni instrucciones AGENTS.md. Se ha creado `/workspace/el-cis-del-pueblo`. El encargo completo se divide en diez hitos; esta entrega implementa la estructura y las páginas iniciales. No hay usuarios, respuestas ni resultados reales. Los guiones en indicadores significan dato no disponible, no cero participantes.

## Decisiones técnicas
- Next.js App Router 16.4.5, React 19.3.1, TypeScript estricto; versiones consultadas en npm y fijadas en lockfile. Node 24.22.1 satisface el requisito >=20.9 de Next. Actualizaciones de seguridad antes de cada despliegue.
- Renderizado estático de contenido público en Hito 1; Route Handler para estado operativo. Sin endpoints de participación, cookies ni analítica. CSS con tokens semánticos y componentes reutilizables; Tailwind no añade valor a esta primera estructura y podrá integrarse sin alterar el dominio.
- Para producción: Next en hosting Node gestionado compatible; PostgreSQL gestionado en región UE (Supabase es candidato, condicionado a contrato, residencia y revisión de costes). Acceso exclusivamente mediante servicios de servidor y rol mínimo, nunca claves privilegiadas en cliente.
- Monolito modular: territorio, campañas, participación, agregación/publicación, preguntas, simulación y administración. Evitar microservicios hasta existir carga medida.
- Validación de esquemas en fronteras HTTP en Hito 4. Transacciones y restricciones de base de datos, no validaciones de interfaz como garantía.
- MapLibre se añadirá cuando exista cartografía preparada; no instalar ahora bibliotecas de mapas o gráficos sin datos que mostrar.
- Preparación para idiomas mediante contenido por locale y códigos de territorio estables; solo español implementado. WCAG 2.2 AA es objetivo, no certificación.

## Flujo de participación propuesto
1. Campaña validada y abierta por servidor. Municipio INE seleccionado manualmente, nunca detectado. Candidaturas cargadas desde la papeleta provincial verificada.
2. Información de tratamiento específica; consentimiento explícito separado si la revisión determina arts. 6.1.a y 9.2.a como base adecuada. No recoger nada antes de completar esta fase.
3. Token de autorización de un uso, efímero, validado en servidor, Turnstile y rate limiting. La IP, si se usa temporalmente en el borde, no se vincula ni exporta al registro de opinión; retención mínima y contrato con proveedor. Evaluar datos y transferencias de Turnstile antes de adoptarlo.
4. Generar secreto aleatorio de 256 bits exclusivo de esa campaña. Mostrarlo una vez, entregable de forma privada sin herramientas de terceros. Guardar solo hash HMAC con clave versionada. Sin credencial global entre encuestas.
5. En una transacción: consumir token, crear respuesta y credencial, registrar versión de consentimiento. La credencial enlaza a esa respuesta: es seudonimización, no anonimato. Separación de esquemas, roles y cifrado limita accesos pero no elimina el enlace.
6. Sustituir: bloquear credencial y respuesta; validar revisión esperada; actualizar opción y municipio y deltas de agregación atómicamente. Reintentos idempotentes. No guardar historial individual de opciones. Dos peticiones concurrentes con igual revisión: una gana, otra conflicto 409.
7. Retirar: eliminar registro sensible y credencial en transacción, decrementar agregado interno y conservar solo comprobante mínimo no enlazable cuando sea necesario. Sin credencial no garantizar recuperación. Debe existir vía de derechos del responsable antes de abrir.

El sistema no garantiza persona única. Una persona puede obtener varias credenciales; las capas antifraude reducen abuso sin resolver identidad. No usar fingerprinting ni cuentas políticas persistentes. Las credenciales de preguntas independientes no se correlacionan. Resolver también registros de proxy, trazas, errores, copias de seguridad y accesos privilegiados antes de activar recogida.

## Publicación segura
Separar agregados internos exactos de publicaciones públicas inmutables. Nunca exponer conteos vivos ni registros de participación. Propuesta inicial k=50, supresión complementaria en jerarquía y categorías, periodos no solapados y conjunto fijo de filtros; evaluar reconstrucción a partir de publicaciones sucesivas antes de elegir tamaño de lote y cadencia. El servicio de publicación aprobará una versión completa de forma atómica; la API solo leerá esas versiones, también para descargas y tarjetas sociales. No prometer 15–60 s si no se puede publicar con seguridad. Caches por versión, ETag y CDN, sin consultas de respuestas en cada visita. Diferencias entre totales, retiradas e históricos requieren revisión específica; k por sí solo es insuficiente.

Denominadores: distribución entre candidaturas / total de respuestas a candidaturas; otras categorías separadas y claramente denominadas. Simulador legal: votos válidos incluyen blancos, no nulos; abstención e indecisión no son votos válidos. No trasladar porcentajes del sondeo a electores.

## Modelo relacional
Ver `db/migrations/0001_foundation.sql` para cimientos ejecutables con restricciones. Es un inicio deliberadamente sin tablas que acepten opiniones. Modelo de siguientes migraciones:

| Dominio / esquema | Entidades y claves | Restricciones principales |
|---|---|---|
| reference | autonomous_communities, provinces, municipalities | códigos de texto con ceros; FK compuesta provincia-comunidad; municipio pertenece a una provincia |
| catalog | elections, constituencies, parties, candidacies, election_ballots | campaña solo con fuentes verificadas; papeleta única campaña-provincia-candidatura; no listas inventadas |
| participation_private | secure_ballot_records | UUID independiente; campaña + territorio + opción validada mediante FK compuestas; revisión optimista; sin IP, nombre ni credencial global |
| authorization_private | participation_credentials, consent_records, spent_tokens | hash único por campaña; enlace explícito a respuesta bajo rol separado; expiración de tokens; consentimiento versionado y retirada |
| aggregation_private | ballot_aggregates, poll_aggregates | único campaña-territorio-opción; contadores >=0; deltas transaccionales; sin exposición pública |
| publication | release_versions, privacy_release_rules, historical_snapshots | versiones cerradas; solo celdas autorizadas; persistir denominador, métrica, periodo y regla aplicada |
| thematic | polls, poll_questions, poll_options | tipo y ámbito explícitos; edición con respuestas crea versión nueva; sin texto libre sensible |
| administration | admin_users, admin_audit_logs, security_events | proveedor OIDC con MFA; roles separados; no respuesta política en auditoría |

Las tablas futuras NO están implementadas. Antes de crearlas: diseño de cifrado con KMS, análisis de acceso y borrado, pruebas de restauración/retención. No usar UUID como si fuera anonimización. RLS y permisos de base de datos cerrados por defecto; migraciones con rol propietario aislado.

## Cartografía y catálogo
Hito 2: descargar catálogo oficial INE, registrar URL, versión, fecha, checksum, licencia y validaciones de totalidad y relaciones. No usar códigos de nombre. Normalizar búsqueda con Unicode, acentos y alias cooficiales revisados; códigos oficiales INE siguen siendo claves. Incluir Ceuta/Melilla correctamente. Importación staging → validación → publicación transaccional; no sobrescribir códigos históricos silenciosamente.

Hito 6: límites administrativos IGN/CNIG con licencia verificada, normalizados a EPSG:4326, validados contra INE, simplificados por zoom preservando topología. Producir PMTiles con capas autonómica/provincial/municipal y propiedades mínimas; CDN/objeto con solicitudes Range. MapLibre con carga progresiva y caché. Canarias en recuadro explícito, Baleares, Ceuta y Melilla navegables. Atribución visible y alternativa de tabla. Diferenciar geometría sin dato de dato suprimido; leyendas y etiquetas accesibles. Sin GeoJSON municipal nacional masivo en navegador. Medir presupuesto de bytes y rendimiento en móvil antes de seleccionar niveles de simplificación.

## Seguridad y operación
Amenazas: bots y campañas coordinadas, CSRF, XSS, inyección, enumeración de credenciales, acceso interno, robo de backups y reconstrucción de celdas pequeñas. Hito 1: sin formularios sensibles; encabezados contra framing, MIME sniffing y geolocalización; CSP inicial permite inline para Next, pendiente nonce antes de producción. No afirmar hardening completo.

Futuro: validación server-side, POST con Origin/CSRF, rate limiting compartido, secretos rotables, redacción de payloads y URLs sensibles en logs, límites de cuerpos y timeouts. Admin OIDC/MFA con autorización en cada operación; sin editar sentido de respuestas; auditoría de acciones, no preferencias. Pruebas adversariales y revisión externa antes de abrir.

## Fuentes electorales
No se ha verificado la convocatoria del 29/11/2026 ni RD 806/2026. No hay campaña configurada. Antes de Hito 4 consultar BOE/JEC y guardar evidencias de convocatoria, anexos, listas provinciales y escaños. En Hito 9 contrastar LOREG vigente, umbral 3%, blanco y desempates, incluyendo sorteo legal cuando proceda; no resolver un empate legal por orden alfabético. Simulación manual por circunscripción; modo basado en sondeo bloqueado si falta cobertura. Ninguna cifra electoral del encargo se trata como fuente oficial.

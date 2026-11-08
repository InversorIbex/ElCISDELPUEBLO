# Costes, despliegue y recuperación

No se ha contratado infraestructura ni desplegado el proyecto. Mantenerlo local cumple la instrucción de no publicar antes de revisión jurídica. Esta arquitectura no obliga a usar Sites para producción; Next.js se mantiene portable.

## Presupuesto orientativo, no tarifa verificada
- Desarrollo local: 0 € adicionales de hosting contratado.
- Piloto cerrado sin opiniones: objetivo 0–15 €/mes si encaja en planes gratuitos; verificar límites, uso comercial y suspensión.
- Servicio con datos sensibles: reservar inicialmente 40–100 €/mes para aplicación Node, PostgreSQL UE, backups, objetos cartográficos y monitorización mínima. Es una estimación de planificación, no precios actuales de proveedor.
- No incluye dominio, impuestos, asesoría jurídica, auditoría, correo de soporte ni operación humana. Miles de visitas no equivalen a miles de escrituras simultáneas; no se afirma una capacidad aún no medida.

Antes de elegir proveedor: comparar coste por CPU/RAM, conexiones, tráfico saliente, almacenamiento, backups, región y soporte. Supabase candidato por PostgreSQL/gestión; evitar su acceso directo desde cliente a respuestas. Comparar hosting Node de precio fijo frente a Vercel por consumo. Cloudflare como borde/cache y objetos; Workers requeriría adaptador Next y validación de compatibilidad, no asumida.

## Controles de gasto
Alertas a 50/80/100% del presupuesto; límite duro si proveedor lo permite, de lo contrario kill switch operacional. Cachear solo publicaciones, límite por ruta/token, tamaño de payload, colas acotadas y límites de base de datos. Objetos con caché larga y versionado. Aplicar modo solo lectura ante anomalía, preservar integridad. Una alerta no garantiza frenar la factura: documentar comportamiento real del proveedor.

## Pipeline previsto
Instalación por `npm ci` con lockfile; pruebas, tipo estricto, build, análisis de dependencias y secretos; despliegue staging sin datos reales; pruebas de navegador y cabeceras; migraciones aditivas verificadas; despliegue de producción solo tras puertas legales/técnicas. Secretos fuera de Git; revisar exactamente logs y capturas de errores. No promover fixtures.

## Copias y recuperación
Copia cifrada diaria y PITR si presupuesto/proveedor lo permite. Objetivo inicial RPO 24 h/RTO 4 h, por validar con restauración cronometrada. Rol distinto para backups, claves separadas. Ensayo mensual de restauración, integridad de agregados y reaplicación de retiradas; no son capacidades implementadas. Reversión de aplicación con migraciones compatibles, no rollback destructivo de base de datos.

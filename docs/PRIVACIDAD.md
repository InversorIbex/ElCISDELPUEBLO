# Registro inicial de riesgos y decisiones de privacidad

No constituye dictamen jurídico. No se recogen opiniones reales. La continuación añade expediente de trabajo en `privacy/`, con bases, flujos, riesgos y decisiones pendientes. Contacto previsto: letrixagame@gmail.com; identidad formal del responsable pendiente. El motor se prueba con datos sintéticos y no está conectado a formularios públicos.

| Riesgo                       | Tratamiento propuesto                                          | Condición pendiente                                              |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Datos de categoría especial  | consentimiento específico si procede y minimización            | responsable, art. 6 y excepción art. 9 revisados jurídicamente   |
| Reidentificación territorial | umbral, supresión complementaria y lotes                       | ensayos de reconstrucción y evaluación de impacto                |
| Correlación de opiniones     | credenciales y claves separadas por campaña; sin perfil global | revisar enlaces indirectos, tiempos, logs y acceso operador      |
| Duplicidad/manipulación      | tokens, límites, automatización y reglas públicas              | no se garantiza persona única; medir falsos positivos            |
| Acceso interno               | privilegio mínimo, cifrado, MFA, auditoría sin opiniones       | revisión de roles y gestión de claves                            |
| Retirada y recuperación      | credencial privada específica y canal de derechos              | información clara si se pierde secreto; verificación no invasiva |
| Terceros/transferencias      | sin analítica; contratos e inventario proveedores              | ubicación efectiva de datos, soporte, subencargados y garantías  |
| Históricos y backups         | agregados evaluados, sin historial individual                  | borrado efectivo, expiración de backups y política de retirada   |

## Finalidades delimitadas

Recoger respuestas voluntarias a una campaña concreta, permitir su corrección/retirada y publicar estadísticas agregadas seguras. Seguridad con finalidad separada. Prohibidos publicidad política, venta, perfiles de afinidad, vinculación de campañas y datos individuales públicos.

## Retención propuesta para revisión (no política vigente)

Tokens: máximo 15 minutos, depuración automática; eventos mínimos de seguridad: 7 días; respuesta activa: mientras campaña permanezca abierta, con eliminación propuesta a 30 días del cierre; credencial y consentimiento enlazables: revisar necesidad exacta, sin retención indefinida. Backups cifrados con expiración propuesta 30 días y procedimiento de reaplicar borrados tras restauración. Retención de evidencia de consentimiento según revisión jurídica: no copiar la preferencia política. Históricos solo si superan evaluación de irreversibilidad y riesgo residual.

## Puertas de apertura

1. Identificar responsable, contacto de derechos y encargados; valorar DPD.
2. Evaluación de riesgo y determinar obligación de EIPD; ante duda por escala y categoría sensible, preparar EIPD antes del piloto.
3. Validación jurídica del consentimiento y textos, revocación, derechos y edades admitidas (sin recoger fecha de nacimiento innecesaria).
4. Ensayos de seudonimización, aislamiento, retirada, restauración y reconstrucción.
5. Autenticación administrativa MFA, pruebas de autorización, antifraude, concurrencia y respuesta a incidentes.
6. Decisión documentada de apertura; un interruptor no sustituye estas comprobaciones.

Mientras estén pendientes: navegación informativa y resultados vacíos. No abrir siquiera un piloto político real para probar la interfaz. Utilizar fixtures sintéticos aislados exclusivamente en pruebas futuras.

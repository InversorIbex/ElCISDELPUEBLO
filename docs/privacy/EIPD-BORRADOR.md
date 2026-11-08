# Evaluación de impacto — expediente de trabajo v0.1

Estado: BORRADOR TÉCNICO. No es EIPD aprobada, dictamen jurídico ni autorización para recoger opiniones reales. Preparado el 8/11/2026.

## Responsable y alcance

Identidad jurídica del responsable: pendiente. Contacto público facilitado: letrixagame@gmail.com. Encargados, región de tratamiento, contratos, DPD si procede y asesor revisor: pendientes. Un correo no identifica por sí solo al responsable ni satisface la información exigible.

Finalidad: sondeos voluntarios por campaña y estadísticas públicas agregadas. No publicidad, venta, afiliación, clasificación individual ni historial de afinidad. No comentarios ni texto libre sensible. Se prevén municipio declarado y respuesta de la campaña; información de consentimiento y credenciales necesarias para ejercer control. No nombre, DNI, dirección, GPS, geolocalización IP o datos electorales censales.

La versión ejecutada es un laboratorio con datos sintéticos. `catalog.campaigns` impide `is_test=false`; el servicio no se conecta desde la web y los endpoints públicos devuelven 423 antes de leer cuerpos.

## Necesidad de evaluación

La escala nacional prevista y las categorías especiales justifican preparar una EIPD completa antes de cualquier piloto de datos reales. Falta que el responsable y especialista confirmen formalmente obligación, alcance y DPD. No se usa el carácter voluntario para eludir la evaluación. Si subsiste alto riesgo que no pueda mitigarse, estudiar consulta previa del artículo 36 antes de tratamiento.

Referencias oficiales consultadas:

- RGPD, arts. 5–7, 9, 12–22, 25, 28, 30, 32, 35 y 36: https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es
- Lista de tratamientos sujetos a EIPD y criterios: https://www.aepd.es/documento/listas-dpia-es-35-4.pdf
- Gestión del riesgo: https://www.aepd.es/guias/gestion-riesgo-y-evaluacion-impacto-en-tratamientos-datos-personales.pdf

## Proporcionalidad y alternativa

La consulta de resultados no requiere opinión. El municipio se elige expresamente. Un mínimo territorial obligatorio puede aumentar el riesgo en localidades pequeñas; evaluar permitir participación solo provincial o suprimir la recogida municipal en unidades de riesgo. Identificación documental daría otra garantía de duplicidad, pero añade datos y riesgos desproporcionados al objetivo; no se implementa. La plataforma renuncia a afirmar unicidad de personas.

Base jurídica candidata: consentimiento para la finalidad concreta y consentimiento explícito para categoría especial (arts. 6.1.a/9.2.a), pendiente de validación. No presumir que el interés estadístico o la excepción de datos manifiestamente públicos justifican automáticamente el tratamiento. Revisar legislación española aplicable, menores y finalidades políticas. La entidad responsable debe decidir y documentar la base antes de recoger.

## Flujo y enlaces

1. Catálogo público en servidor, sin ubicación inferida.
2. Información específica de campaña/versión y decisión explícita.
3. Protección de automatización en servidor: pendiente integración real de proveedor. El laboratorio solo emite tokens sintéticos.
4. Secreto de credencial aleatorio de 256 bits, entregado de forma privada. HMAC con propósito/campaña separa las claves lógicas.
5. Respuesta cifrada AES-256-GCM con AAD de campaña y registro. Hash de credencial enlaza a registro cifrado en otro esquema. Consentimiento guarda versión y fecha, sin opción.
6. Correcciones bajo revisión optimista y bloqueo transaccional. No historial de preferencias anterior. Las copias/WAL pueden contener estados antiguos y precisan retención efectiva.
7. Agregados internos exactos con acceso restringido. Publicaciones distintas y nunca lectura directa de respuestas desde la API pública.
8. Retirada borra la respuesta activa, credencial y consentimiento enlazado en la implementación de laboratorio. La conservación legal de una evidencia no enlazable y los efectos sobre agregados publicados requieren revisión.

## Riesgos para personas y controles

Escala preliminar propia: gravedad y probabilidad 1–5; producto solo para priorizar, no determina licitud. Las puntuaciones residuales son estimaciones técnicas, no aceptación del riesgo.

| Escenario                                     | Inicial G×P | Medidas existentes / previstas                                                                     | Residual provisional | Evidencia pendiente                                                        |
| --------------------------------------------- | ----------: | -------------------------------------------------------------------------------------------------- | -------------------: | -------------------------------------------------------------------------- |
| Identificación por municipio y opción raros   |         5×4 | no publicación real; umbral + bloqueo global de categorías pequeñas en prototipo                   |                  5×2 | ataques de reconstrucción y homogeneidad, asesoría estadística             |
| Diferencia entre periodos o jerarquías        |         5×4 | solo una publicación nacional de prueba por campaña cerrada; rechaza subterritorios y repeticiones |                  5×2 | política para series, correcciones y filtros aún no diseñada               |
| Robo de base o acceso operador                |         5×3 | AEAD y esquemas separados, sin acceso PUBLIC; credenciales solo HMAC                               |                  5×2 | KMS externo, roles reales separados, rotación y auditoría                  |
| Correlación por tiempo, WAL, logs o proveedor |         5×3 | sin hora en respuesta, consentimiento por fecha; no logs de payload en código                      |                  5×3 | proxy/CDN/hosting, retención WAL/backups, trazas y personal soporte        |
| Bots, coordinación y respuestas múltiples     |         3×5 | tokens únicos, concurrencia probada, primitiva de rate limit compartido                            |                  3×4 | Turnstile/verificación real, reglas públicas, tasas de falsos positivos    |
| Pérdida/robo de credencial                    |         4×3 | secreto de alta entropía, ninguna credencial global                                                |                  4×2 | almacenamiento elegido por participante y canal de derechos sin credencial |
| Borrado incompleto tras restauración          |         5×3 | borrado activo transaccional probado                                                               |                  5×3 | copia/restauración y registro de retiradas sin crear perfiles              |
| Uso secundario de datos o captura analítica   |         5×3 | sin analítica terceros ni perfil político                                                          |                  5×2 | contratos, controles humanos, inventario y auditorías                      |

## Decisiones aún necesarias

- Confirmar responsable, base, contacto y papel de cada proveedor; región UE no elimina por sí sola transferencias.
- Definir edad admisible y controles no invasivos.
- Seleccionar solución de claves externa, rotación y respuesta a compromiso; claves en memoria solo para pruebas.
- Aprobar retención por cada dato (incluidos tokens, logs de borde, WAL, backups y consentimiento).
- Determinar el protocolo de retirada y de preservación/borrado de publicaciones realmente anónimas.
- Revisar el diseño con adversario que conoce pertenencia a un municipio y presencia de participantes. Umbral k no cubre homogeneidad ni conocimiento auxiliar.
- Acordar presupuesto de publicaciones y pérdidas de utilidad aceptables. No ofrecer series móviles o filtros arbitrarios hasta resolverlo.
- Realizar consulta especializada y, si procede, previa a la autoridad; registrar decisión y firma del responsable.

## Cierre

Sin aprobación jurídica, técnica y del responsable, el riesgo residual NO está aceptado. No hay fecha de apertura prevista. El expediente necesita completar anexos de proveedores, retención, pruebas adversariales y acta de aprobación. Las pruebas sintéticas no acreditan anonimato, representatividad ni conformidad normativa.

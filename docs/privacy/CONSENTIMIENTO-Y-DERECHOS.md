# Consentimiento y derechos — diseño para revisión

Sin eficacia operativa mientras falte revisión y responsable. Contacto previsto: letrixagame@gmail.com; identidad formal pendiente.

## Información antes de decidir

La pantalla previa a cada campaña deberá identificar al responsable y contacto, finalidad concreta, categoría especial, base del art. 6 y condición del art. 9, territorio declarado, destinatarios/encargados, transferencias, retención, riesgos de seudonimización, derechos, retirada y reclamación ante autoridad. Identificar edición/versionado del texto y de las opciones. Explicar que no hay selección aleatoria ni unicidad garantizada.

Consultar datos agregados no exigirá consentimiento de opinión. No preseleccionar casillas, no unir marketing, no bloquear toda la navegación si se rechaza y no interpretar continuar como consentimiento. Cada pregunta independiente tendrá nueva decisión, sin reutilizar un identificador global. No hay interfaz operativa de aceptación en esta entrega.

## Redacción de trabajo

Texto orientativo mostrado en `/privacidad`: decisión explícita para campaña concreta y municipio declarado, con finalidad estadística agregada y mecanismo de retirada. Debe completarse y aprobarse. No se puede prometer anonimato absoluto, eliminación instantánea de todas las copias ni reconocimiento sin credencial.

El motor de laboratorio comprueba `explicitConsent === true` y la versión exacta dentro de la transacción. Una versión obsoleta impide la inserción y conserva el token sin consumir. El registro de consentimiento guarda versión y día, no la opinión. El esquema actual borra ese registro enlazado al retirar; evaluar si es necesario conservar una evidencia separada y cómo hacerlo sin reconstruir perfiles.

## Sustitución y retirada

La credencial es específica de campaña; se recomienda entregar instrucciones de conservación privada sin publicidad ni servicios analíticos. La API de pruebas recibe el secreto solo en cuerpo no registrable, nunca en URLs. Los endpoints públicos no leen cuerpos y rechazan cualquier envío actualmente.

Corrección: autenticar credencial, validar campaña/opción/territorio y revisión esperada; sustituir AEAD y ajustar ambos contadores en la misma transacción. Una revisión desactualizada exige reintento explícito y no cuenta dos veces.

Retirada: autenticar y eliminar respuesta + credencial + consentimiento enlazado; restar agregado interno. Se permite al cerrar la campaña. Si existieran publicaciones, no generar automáticamente una segunda versión con la resta individual: riesgo de diferencias. Los agregados previos solo podrán conservarse si se justifica su condición no identificable; de lo contrario habrá que retirarlos o aplicar medidas revisadas. Resolver esto antes de publicar datos reales.

## Solicitudes de derechos

El correo es un contacto inicial, no un sistema ya auditado de atención. Antes de abrir se requiere procedimiento, responsable de resolución, plazos legales y verificación proporcional. No solicitar DNI por defecto. No enviar credenciales por email ni incluir preferencias en tickets o herramientas de soporte.

Con credencial: diseñar canal directo cifrado y autenticado de derechos, con respuesta que no incluya opiniones en logs. Sin credencial: explicar honestamente las limitaciones de identificación y aplicar el artículo 11 cuando proceda, previa revisión. No recoger nuevos identificadores solo para fingir capacidad de localizar respuestas.

Preparar registros mínimos del trámite sin preferencias; evaluar oposición/limitación/portabilidad según base y circunstancias. Ante errores o filtraciones seguir `OPERACION.md`. La revisión especializada confirmará los derechos aplicables y el texto definitivo.

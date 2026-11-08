# Verificación de logotipos · 8 de noviembre de 2026

## Estado en la rama de revisión
- 534 candidaturas provinciales (91 denominaciones distintas).
- 17 imágenes locales con hashes y fuentes documentadas.
- 19 imágenes vinculadas desde fuentes Wikimedia Commons y servidas mediante el endpoint propio `/api/party-logo/[id]`.
- **485 candidaturas con logotipo asociado (90,8 %)**, 49 pendientes de encontrar o contrastar (37 nombres distintos).
- Los 17 primeros recursos externos devolvieron HTTP 200 y bytes PNG válidos en preview de Vercel `b1b3dd2`: PP, PSOE, VOX, Podemos, PCTE, SALF, BNG, Junts, ERC, PNV, Mundo Más Justo, PSC, PCTC, Teruel Existe, Drago Canarias, Soria ¡Ya! y Convergents.
- Compromís Front Valencià devolvió HTTP 200 PNG en preview `71f8377`.
- PREPAL fue corregido a `PREPAL (sigloide).svg` y devolvió HTTP 200 PNG en preview `4446c35`.

**Atención:** HTTP 200 y PNG real solo verifican la disponibilidad técnica. No certifican que cada imagen sea el símbolo electoral exacto presentado a la Junta Electoral en noviembre de 2026, ni verifican todos los derechos de uso. La revisión visual y jurídica de cada símbolo continúa pendiente.

## Votación
El endpoint público de participación sigue **cerrado** (423 para POST), incluso si la papeleta de demostración permite seleccionar una candidatura. El código de persistencia está preparado, pero carece de conexión/validación para producción y de aprobación jurídica. No permitir publicar resultados de votos no recibidos.

## Pendientes prioritarios
1. Localizar y verificar 37 denominaciones sin símbolo, priorizando coaliciones y partidos minoritarios.
2. Verificar visualmente compatibilidad de logos y atribuciones.
3. Revisar bases jurídicas RGPD arts. 6 y 9, EIPD, privacidad de contadores IP, seguridad, límites por navegadores y política de publicación antes de habilitar votos.
4. Ejecutar pruebas transaccionales de concurrencia y borrar registros de control según el periodo acordado.

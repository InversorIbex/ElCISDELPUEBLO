# Noche electoral del 29-N

## Antes del domingo

En Vercel (producción) hacen falta:

- `VOTE_DATABASE_URL`: la misma base de Supabase que usa el sondeo. La tabla `poll_private.election_night` se crea sola la primera vez (o con `db/migrations/0007_election_night.sql`).
- `RECUENTO_ADMIN_TOKEN`: una clave aleatoria de 32 caracteres o más. Sirve para cargar datos. No la compartas.

Para generar la clave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Durante la jornada

1. A las 14:00 y a las 18:00, Interior publica la participación. Rellena `turnoutUpdates` y carga:

   ```sh
   RECUENTO_ADMIN_TOKEN=... node scripts/push-recuento.mjs recuento.json
   ```

   La participación se muestra en cuanto se carga, porque es un dato oficial y no un sondeo.

2. Desde las 21:00, cada vez que Interior actualice el escrutinio, copia los escaños y el porcentaje de voto de cada partido en `parties`, sube `scrutinized` y vuelve a cargar. La web consulta cada 30 segundos.

3. Con el 100 % escrutado y los 350 escaños asignados, pon `"final": true`.

Ejemplo de `recuento.json` en la cabecera de `scripts/push-recuento.mjs`. Los partidos usan los mismos identificadores que la porra. Las candidaturas regionales de un mismo partido (PSC, PSdeG…) van dentro de su partido, igual que en el resto de la web.

## Qué protege el servidor

- Antes de las 21:00 del 29-N (`BLACKOUT_END`), `GET /api/recuento` no devuelve escaños, votos ni porcentaje escrutado, aunque se hayan cargado.
- El POST exige `Authorization: Bearer <RECUENTO_ADMIN_TOKEN>` y valida cada campo (ids conocidos, escaños de 0 a 350, porcentajes de 0 a 100, suma de escaños como máximo 350 y exactamente 350 si es final).

## Porra

Cada porra vive en su enlace. Sumar no se presenta con marca propia: no está en la porra, y sus escaños de 2023 y los enlaces antiguos con `SUMAR` pasan a Frente Amplio. Compromís va en `OTROS` en el recuento. Cuando el recuento tiene escaños, la porra calcula su puntuación: el 80 % del total va por escaños bien colocados, 12 puntos por acertar el primer partido y 8 por acertar si hay mayoría absoluta.

### Clasificación

- Quien quiere apunta su porra con un apodo (`POST /api/porra`, con Turnstile y la credencial anónima del navegador). Una porra por navegador y se puede cambiar hasta las 20:00 peninsulares (`PORRA_CLOSES_AT`), cuando salen los sondeos a pie de urna. Máximo 5 porras nuevas por conexión y hora. Los apodos no se repiten.
- Se guarda en `poll_private.porra_entries`: apodo, porra y HMAC del navegador. La IP solo como HMAC en `porra_ip_window`.
- Antes de las 21:00 (`BLACKOUT_END`) `GET /api/porra` solo devuelve la porra apuntada desde ese navegador: ni porras ajenas ni cuántas hay. Después, y con escaños en el recuento, devuelve las 100 primeras y la posición propia. Nunca devuelve sumas ni medias.
- Desempate: menos escaños de error y, después, quien la apuntó (o cambió) antes.
- Para quitar un apodo ofensivo: `UPDATE poll_private.porra_entries SET hidden=true WHERE porra_id='congreso-2026-11-29' AND lower(alias)=lower('…');`


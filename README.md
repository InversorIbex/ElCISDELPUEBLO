# EL PUEBLO OPINA

Proyecto público «EL PUEBLO OPINA». Aplicación Next.js con catálogo INE 2026, mapa autonómico IGN, simulador manual y motor PostgreSQL aislado de pruebas, sin recogida de opiniones ni resultados ficticios. Interfaz informativa publicada en https://elcisdelpueblo.vercel.app/. La recogida de opiniones sigue cerrada; no es una versión de producción del motor de votos.

Requisitos: Node >=20.9 (validado con 24.22.1), npm 11.

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000. Comprobaciones: `npm test`, `npm run build`, `npm run typecheck`. Producción local: `npm run build` y `npm start`.

- `docs/ARQUITECTURA.md`: decisiones, participación, modelo relacional y cartografía.
- `docs/PRIVACIDAD.md`: riesgos y condiciones de apertura.
- `docs/COSTES-Y-DESPLIEGUE.md`: presupuesto estimado y operación prevista.
- `docs/HITOS.md`: plan e informe del primer hito.
- `docs/VALIDACION.md`: comprobaciones y límites de esta entrega.
- `db/migrations/0001_foundation.sql`: cimientos PostgreSQL no aplicados, sin tablas sensibles.

La convocatoria del 29/11/2026 y los 350 escaños en 52 circunscripciones están verificados en el RD 806/2026 del BOE; la instantánea de 534 candidaturas está importada con las correcciones revisadas a 8/11/2026. El catálogo INE está validado y su importación PostgreSQL está probada. La web pública no se conecta al motor de prueba ni necesita credenciales para ejecutar las pantallas. No habilitar recogida añadiendo un simple interruptor: completar antes las puertas documentadas de privacidad, seguridad y datos oficiales.

## Catálogo territorial

8.132 municipios, 52 códigos provinciales y 19 comunidades/ciudades autónomas, según INE a 1/1/2026. `/mapa` permite buscar y seleccionar territorio; `/espana` abre el directorio. Las fichas no contienen resultados de opinión.

El catálogo completo permanece en servidor. `/api/territorios?q=lourenza` devuelve como máximo 20 municipios; `?province=27` lista una provincia; `?community=12` filtra provincias. Los filtros incompatibles devuelven 400.

Para reproducir la importación (Python 3 y dependencia aislada en un venv):

```sh
python3 -m venv work/data-venv
work/data-venv/bin/pip install -r scripts/requirements-data.txt
python3 scripts/fetch-ine.py --destination work/ine
work/data-venv/bin/python scripts/import-ine.py --source-dir work/ine
work/data-venv/bin/python scripts/test-import-ine.py --source-dir work/ine
```

La descarga comprueba los SHA-256 de la versión incluida; si INE modifica un archivo, se detiene para revisión. No se regeneran datos silenciosamente. Los alias editoriales se mantienen en `data/territories/aliases.json`. Fuentes, licencia y límites: `docs/HITO-2.md` y `/fuentes`.

`npm run check:build`, después del build, comprueba el HTML prerenderizado y que el catálogo no viaje en los bundles cliente. La configuración de CI ejecuta pruebas, build, tipos y esta comprobación. Su estado remoto debe confirmarse en GitHub; las comprobaciones documentadas se han ejecutado localmente.

## Motor PostgreSQL de laboratorio

Solo datos sintéticos. El esquema impide campañas reales (`is_test=false`), el factory exige base terminada en `_test` y el motor rechaza `NODE_ENV=production`. Las claves aleatorias de prueba se mantienen en memoria. No activar la recogida pública a partir de esta configuración.

```sh
docker compose -f compose.test.yml up -d
TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/cis_pueblo_test npm run test:integration
docker compose -f compose.test.yml down
```

La imagen PostgreSQL está fijada por digest. Puerto solo loopback, autenticación trust **exclusivamente para este laboratorio desechable** y sin volumen. El runner aplica migraciones con checksums, importa INE transaccionalmente y prueba inserción, corrección, retirada, concurrencia, aislamiento, permisos y publicaciones sintéticas. No usar la URL de una base real.

`/api/participaciones`, `/corregir` y `/revocar` bajo esa ruta rechazan POST con 423 sin leer el cuerpo. No hay un formulario electoral real habilitado.

## Simulador y mapa

`/simulador`: cálculo local de escenarios hipotéticos por circunscripción; votos o porcentajes, blanco, nulo, umbral y cocientes exactos. En empates no resueltos se detiene. No se envían los parámetros al servidor. Reparto territorial del RD 806/2026 verificado, sin candidaturas de 2026 importadas.

`/mapa`: SVG autonómico derivado del WFS INSPIRE del IGN, con atribución y recuadros de escala propia. No muestra opiniones. No es todavía el mapa multinivel MapLibre/PMTiles previsto. Pipeline offline:

```sh
python3 -m venv work/geo-venv
work/geo-venv/bin/pip install -r scripts/requirements-geo.txt
python3 scripts/fetch-community-geometries.py --destination work/ign
work/geo-venv/bin/python scripts/build-community-map.py --source-dir work/ign
```

Datos fuente pesados solo offline; el mapa final está limitado a 400 KB sin comprimir. No es cartografía para medición o delimitación jurídica. Huellas, simplificación y condiciones incluidas en el artefacto.

## Estado del plan

Ver `docs/ESTADO-DEL-PLAN.md` y `docs/CONTINUACION-3-6-9.md`. Privacidad: expediente EIPD, consentimiento/derechos y operación en `docs/privacy/`. No están aprobados jurídicamente. Contacto público facilitado: letrixagame@gmail.com; identidad formal del responsable aún pendiente. No hay despliegue ni opiniones reales.

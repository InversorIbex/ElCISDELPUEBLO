# El CIS del Pueblo

Hitos 1–2: aplicación Next.js con catálogo oficial INE 2026 y explorador territorial, sin recogida de opiniones ni resultados ficticios. No está lista para producción. No se ha publicado.

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

La fecha y el real decreto electorales del encargo no están verificados. El catálogo territorial INE 2026 está importado y validado; no hay datos electorales importados. No hay base de datos conectada, credenciales ni variables necesarias para ejecutar la aplicación. No habilitar recogida añadiendo un simple interruptor: completar antes las puertas documentadas de privacidad, seguridad y datos oficiales.


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

# El CIS del Pueblo

Hito 1: aplicación Next.js informativa, sin recogida de opiniones ni resultados ficticios. No está lista para producción. No se ha publicado.

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

La fecha y el real decreto electorales del encargo no están verificados. No se han importado datos oficiales. No hay base de datos conectada, credenciales ni variables necesarias para ejecutar Hito 1. No habilitar recogida añadiendo un simple interruptor: completar antes las puertas documentadas de privacidad, seguridad y datos oficiales.

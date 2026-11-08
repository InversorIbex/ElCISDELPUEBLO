# Despliegue en Vercel

La portada es `app/page.tsx` (Next.js App Router). No se necesita `index.html`, ni una redirección global a ese archivo. Hay páginas dinámicas y API: no publicar `public/` como si fuera todo el sitio ni usar exportación estática.

`vercel.json` fija framework Next.js, instalación con `npm ci`, compilación con `npm run build` y salida `.next`.

Configuración del proyecto Vercel:

- Repositorio: `InversorIbex/ElCISDELPUEBLO`.
- Rama de producción: `main`.
- Root Directory: raíz del repositorio (campo vacío o `.`), donde están `package.json` y `app/`. No `app`, `public` ni el nombre del directorio local.
- Framework Preset: Next.js.
- Build/Output: valores de `vercel.json`; desactivar overrides antiguos de otro framework si persisten.
- Node.js: 24.x, igual que CI.

Después de corregir ajustes, desplegar el último commit de `main` sin reutilizar la caché anterior. En Build Logs debe aparecer `next build` y la tabla de rutas, incluida `/`. Un correo de despliegue exitoso solo confirma el proceso; verificar también la URL del deployment y el dominio de producción.

Si la URL particular del deployment funciona pero `elcisdelpueblo.vercel.app` falla, revisar Settings → Domains y que el deployment esté asignado a Production. Si ambas devuelven el 404 de plataforma, revisar raíz, framework, salida y archivos generados. Este repositorio no puede cambiar la raíz, dominios o rama configurados en la cuenta de Vercel.

Comprobación HTTP: portada y `/api/status` deben responder 200; `POST /api/participaciones` permanece cerrado (423), mientras que GET devuelve 200 con el estado de cierre, según el diseño vigente. Publicar la interfaz no autoriza recoger respuestas políticas ni requiere credenciales de PostgreSQL de producción.

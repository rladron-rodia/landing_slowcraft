# MIGRATION — Producto #001 (Landing_Site)

> **Cómo el cliente se lleva su instance del Template fuera de Slowcraft.**
> Promesa de portabilidad sin lock-in.

**Versión:** v0.1 (Fase A — el documento existe; el flujo de export se prueba en Fase E)

---

## 1. Qué se entrega al cliente

Cuando un cliente solicita transfer de su instance, recibe:

```
client-<slug>-landing/             ← repo Git completo
├── package.json
├── pnpm-lock.yaml
├── (todo el árbol de archivos del fork)
└── platform-docs/
    ├── MIGRATION.md               ← este documento, customizado
    ├── ARCHITECTURE.md
    ├── RUNBOOK.md
    ├── CHANGELOG.md
    ├── DELIVERY.md
    ├── PLUGINS.md
    ├── README.md
    └── .env.example

(opcional, si la instance usa DB)
client-<slug>-landing-db-dump.sql  ← dump pg_dump completo
```

Plus:
- Checklist de DNS / SSL para reapuntar el dominio fuera de Slowcraft.
- Acceso completo al repo GitHub (transferido a la org del cliente).

---

## 2. Qué hace el cliente para deployar fuera de Slowcraft

### 2.1 Opción 1 — Cloudflare Pages (recomendado, mismo stack)

```bash
# 1. Clonar el repo
git clone git@github.com:<su-org>/<client-landing-repo>.git
cd <client-landing-repo>

# 2. Conectar a Cloudflare Pages
#    - Crear cuenta Cloudflare si no la tiene.
#    - Pages → Create project → Connect to GitHub → seleccionar el repo.
#    - Build command: pnpm install && pnpm --filter template-next build
#    - Output directory: template-next/out
#    - Root directory: /

# 3. Configurar env vars en Cloudflare Pages dashboard:
#    - NEXT_PUBLIC_CONTACT_ENDPOINT (su backend o servicio de form)
#    - NEXT_PUBLIC_GA4_ID (su propiedad GA4)
#    - NEXT_PUBLIC_GTM_ID (su contenedor GTM)
#    - (otros plugins según uso)

# 4. Conectar dominio
#    - DNS del dominio del cliente → Cloudflare.
#    - SSL Universal automático.

# 5. Push a main → auto-deploy.
```

### 2.2 Opción 2 — Vercel

```bash
# 1. Clonar el repo (igual).
# 2. vercel link
# 3. vercel env add NEXT_PUBLIC_CONTACT_ENDPOINT
#    (repetir para cada env var)
# 4. vercel --prod
```

Output mode: `next.config.mjs` ya tiene `output: 'export'`. Para Vercel también funciona; alternativamente quitar `output: 'export'` y usar SSR/ISR de Vercel para mejor performance.

### 2.3 Opción 3 — Railway

```bash
# 1. railway login
# 2. railway init
# 3. railway up
# 4. Agregar env vars en Railway dashboard.
# 5. Conectar dominio en Railway → Settings → Custom Domain.
```

### 2.4 Opción 4 — Tu propio servidor (Docker)

`Dockerfile` incluido en el Template (Fase E):

```bash
docker build -t <client-landing> .
docker run -p 3000:3000 -e NEXT_PUBLIC_CONTACT_ENDPOINT=... <client-landing>
```

---

## 3. Configuración del backend (si tu instance lo usa)

La instance Slowcraft usa un backend Express + Postgres en Render. Si el cliente quiere replicarlo:

### 3.1 Stack legacy del backend Slowcraft

```bash
cd backend
npm install
cp .env.example .env

# editar .env con sus credenciales
# - DATABASE_URL (Postgres propio: Supabase, Neon, RDS, etc.)
# - RESEND_API_KEY (su cuenta Resend)
# - CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
# - ADMIN_EMAIL, ADMIN_PASSWORD_HASH (npm run hash-password)
# - JWT_SECRET (random hex 48+ bytes)
# - APP_BASE_URL (la URL del backend deployado)
# - ALLOWED_ORIGINS (el dominio del landing)

# importar el dump (si recibió uno)
psql $DATABASE_URL < client-<slug>-landing-db-dump.sql

# arrancar
npm run migrate
npm start
```

Compatibilidad de hosting:
- **Render** (estado actual de Slowcraft): usar `backend/render.yaml`.
- **Railway**: añadir `Procfile` con `web: node src/server.js`.
- **Fly.io**: `fly launch` desde el `backend/` directory.
- **Heroku-like**: `Procfile` y env vars equivalentes.

⚠️ **Render free tier bloquea SMTP outbound.** Si migra a otro proveedor que también lo bloquee, usar Resend HTTP API (ya implementado).

### 3.2 Alternativa: backend serverless

Si no quiere mantener un Express, puede:
- **Reemplazar el form** con un servicio externo (Formspree, Tally, Basin, Static Forms).
- **Migrar a Supabase** + un Edge Function para `/api/contact` + leads en Supabase tabla.
- **Usar Vercel/Cloudflare functions** y guardar leads en KV o D1.

En todos los casos, actualizar `NEXT_PUBLIC_CONTACT_ENDPOINT` para que apunte al nuevo endpoint.

---

## 4. Checklist DNS / SSL

Para reapuntar el dominio fuera de Slowcraft:

- [ ] Recibir el repo transferido a la org GitHub del cliente.
- [ ] Recibir el dump de DB (si aplica).
- [ ] Crear cuentas necesarias (Cloudflare/Vercel/Railway/etc.).
- [ ] Configurar env vars en el nuevo deploy.
- [ ] Build inicial OK en preview.
- [ ] Smoke test: form llega al backend nuevo, dataLayer events disparan.
- [ ] Migrar DNS:
  - Si el dominio sigue siendo del cliente: cambiar A/CNAME records hacia el nuevo deploy.
  - Si el dominio era de Slowcraft (ej. `<slug>.slowcraft.ai`): solicitar un dominio propio del cliente y hacer redirect 301 desde el viejo durante un período.
- [ ] Verificar SSL automático activo (Let's Encrypt, Cloudflare SSL).
- [ ] Verificar dominio en Resend (TXT/MX) si usa el backend Slowcraft pattern.
- [ ] Confirmar GA4 / GTM siguen reportando al property correcto.
- [ ] Notificar a Slowcraft cuando el cutover esté listo para que apaguemos los recursos del lado Slowcraft.

---

## 5. Qué NO se transfiere

- Acceso a la Plataforma Slowcraft (Mission Control, Agency Hub).
- `@slowcraft/product-sdk` connection (si la usaba — se desactiva al transferir).
- Templates futuros que la Plataforma agregue al fork (las propagaciones automáticas se desactivan).
- Soporte de Slowcraft (a menos que se contrate aparte).

El cliente recibe el código y los datos. **Las herramientas de la Plataforma son IP de Slowcraft y no se transfieren.**

---

## 6. Tiempo estimado del cutover (estimación honesta)

| Fase | Tiempo |
|---|---|
| Setup de cuentas (Cloudflare/Vercel/etc.) | 30-60 min |
| Configuración de env vars + primer deploy | 30 min |
| Migración de DNS (espera de propagación) | 1-24 horas |
| Verificación SSL | 5-15 min (Cloudflare automático) |
| Smoke testing post-cutover | 1-2 horas |
| **Total** | **medio día a un día** |

Si el cliente tiene equipo técnico interno: rápido.
Si necesita acompañamiento: Slowcraft puede ofrecerlo como servicio aparte.

---

## 7. Rollback (en caso de problema en el cutover)

Cloudflare Pages / Vercel / Railway todos permiten **mantener el deploy viejo** durante el switch. Procedimiento:

1. Mantener el deploy de Slowcraft activo en su dominio anterior (`<slug>.slowcraft.ai`).
2. Configurar el deploy nuevo del cliente en su dominio.
3. Probar el deploy nuevo durante 48-72 horas con tráfico de prueba.
4. Hacer cutover de DNS solo cuando el deploy nuevo esté validado.
5. Mantener el deploy de Slowcraft activo durante 14 días post-cutover por si hay rollback.

---

## 8. Soporte post-transfer

Por defecto, **el cliente opera el fork de forma independiente** post-transfer. Slowcraft puede:

- Ofrecer **soporte premium** (contrato aparte) para mantenimiento, actualizaciones, monitoreo.
- Ofrecer **migration assistance** (sesión técnica de cutover guiada).
- Ofrecer **propagación opt-in** de mejoras del Template (PRs manuales, no automáticos post-transfer).

---

## 9. Verificación de la migration

CI test de smoke (Fase E) que valida automáticamente que un fork del Template:
- Builds correctamente con `pnpm build`.
- Deploys a un Vercel preview con env vars dummy.
- Sirve la página principal con HTTP 200.
- Form retorna error esperado sin endpoint configurado (graceful degradation).
- Lighthouse Performance ≥ 90 en el preview.

Si el test falla → el `MIGRATION.md` está roto y bloquea el release del Template.

---

*platform-docs/MIGRATION.md · v0.1 · Producto #001 · 2026-05-10 · Promesa de portabilidad sin lock-in*

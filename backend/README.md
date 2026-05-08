# Slowcraft API

Backend Node + Express + Postgres para la landing de Slowcraft. Hosteado en [Render](https://render.com), email vía [Resend](https://resend.com) (SMTP).

## Stack

- **Runtime:** Node 22 (ESM)
- **Web:** Express 4
- **DB:** Postgres (Render managed)
- **Email:** Resend SMTP vía nodemailer
- **Hardening:** helmet, cors, express-rate-limit
- **Deploy:** Render Blueprint (`render.yaml`)

## Estructura

```
backend/
├── package.json
├── render.yaml              # Blueprint Render (web service + Postgres)
├── .env.example             # Plantilla de variables (NO commitear .env real)
├── migrations/
│   └── 001_init.sql         # Schema base: _migrations + leads
└── src/
    ├── server.js            # Express app + routes
    ├── db.js                # Pool de Postgres
    ├── email.js             # Resend SMTP + templates
    └── migrate.js           # Runner de migraciones
```

## Endpoints

### Públicos (Fase 1)

| Método | Ruta            | Descripción                                        |
|--------|-----------------|----------------------------------------------------|
| GET    | `/`             | Info básica del servicio                           |
| GET    | `/healthz`      | Health check (incluye ping a DB)                   |
| POST   | `/api/contact`  | Recibe form de contacto · valida · guarda · envía  |

### Admin (Fase 2 — todos requieren cookie de sesión salvo `/login`)

| Método | Ruta                       | Descripción                                          |
|--------|----------------------------|------------------------------------------------------|
| POST   | `/api/admin/login`         | Login con email + password                           |
| POST   | `/api/admin/logout`        | Cierra sesión                                        |
| GET    | `/api/admin/me`            | Verifica sesión activa                               |
| GET    | `/api/admin/stats`         | Counts por status                                    |
| GET    | `/api/admin/leads`         | Lista leads (filtros: status, motivo, q, from, to)  |
| GET    | `/api/admin/leads/:id`     | Detalle de un lead + timeline de eventos             |
| PATCH  | `/api/admin/leads/:id`     | Actualiza status y/o notas (con audit en lead_events)|

### Frontend admin

| Ruta                  | Descripción          |
|-----------------------|----------------------|
| `GET /admin/login`    | Página de login      |
| `GET /admin/dashboard`| Dashboard de leads   |

### POST /api/contact

```json
{
  "nombre": "Ada Lovelace",
  "email": "ada@empresa.com",
  "cargo": "CTO",
  "empresa_web": "empresa.com",
  "motivo": "proyectos",
  "descripcion": "...",
  "_meta": { "referrer": "..." }
}
```

Validación: campos obligatorios, email corporativo (bloquea gmail/outlook/etc.), motivo en lista permitida, descripción 20-1000 chars. Honeypot en campo `website`. Rate limit: 5 req/min/IP.

Respuestas: `200 { ok: true, leadId }` · `400 { error, fields }` · `429 { error }` · `500 { error }`

## Roadmap (próximas fases)

- **Fase 2 — Admin auth + dashboard de leads:** login, sesiones, listar/filtrar leads, marcar status, agregar notas.
- **Fase 3 — CMS de contenido:** tabla `content_blocks` (sección + clave + valor), endpoints público y admin, landing consume vía API con fallback hardcoded.
- **Fase 4 — Polish:** cron warm-up, audit log, exportar leads a CSV, notificación a Slack opcional.

## Setup local (opcional — solo si querés probar antes de deploy)

```bash
cd backend
npm install
cp .env.example .env
# Editá .env con DATABASE_URL local, RESEND_API_KEY, etc.
npm run migrate
npm run dev
# API en http://localhost:8080
```

## Deploy en Render

Ver paso a paso completo en el README principal del repo (sección **Deploy del backend**). Resumen:

1. Push del repo a GitHub (con la carpeta `backend/`).
2. Crear cuenta Render → **New → Blueprint** → conectar el repo.
3. Render detecta `render.yaml` y aprovisiona web + Postgres.
4. Configurar los 3 secrets en el dashboard: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
5. Deploy automático en cada push a `main`.

## Variables de entorno

| Variable               | Quién la setea | Ejemplo                                  |
|------------------------|----------------|------------------------------------------|
| `DATABASE_URL`         | Render auto    | `postgres://…` (inyectada por blueprint) |
| `ALLOWED_ORIGINS`      | render.yaml    | `https://rladron-rodia.github.io,…`      |
| `RESEND_API_KEY`       | secret manual  | `re_xxxxxxxxxxxx`                        |
| `CONTACT_TO_EMAIL`     | secret manual  | `hola@slowcraft.ai`                      |
| `CONTACT_FROM_EMAIL`   | secret manual  | `Slowcraft <noreply@slowcraft.ai>`       |
| `ADMIN_EMAIL`          | secret manual  | tu email                                 |
| `ADMIN_PASSWORD_HASH`  | secret manual  | `$2a$12$...` (bcrypt — usar `npm run hash-password`) |
| `JWT_SECRET`           | secret manual  | string random ≥48 chars                  |
| `NODE_ENV`             | render.yaml    | `production`                             |
| `PORT`                 | Render auto    | `10000` (lo asigna Render)               |

## Generar el password hash del admin

```bash
cd backend
npm install
npm run hash-password -- "tuPasswordSeguro123"
# copiar el hash que imprime y pegar en Render como ADMIN_PASSWORD_HASH
```

Para `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Notas operativas

- **Cold starts (plan free):** el web service se duerme tras 15 min sin tráfico. El primer submit del día puede tardar ~30s. Mitigación opcional: cron-job.org pingueando `/healthz` cada 14 min.
- **Postgres free expira a los 90 días.** Recordatorio para upgrade o backup antes.
- **Migraciones se corren en cada deploy** (vía `buildCommand` en render.yaml). Idempotentes — solo aplica las nuevas.

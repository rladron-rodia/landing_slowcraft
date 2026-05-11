# Slowcraft — Landing + Admin

Landing page bilingüe de **Slowcraft** (Strategy & Programs · IA deliberadamente diseñada) + sistema de administración completo (CMS bilingüe + dashboard de leads + configuración de analytics).

**Live:**
- Landing: [slowcraft.ai](https://slowcraft.ai/) (origen GitHub Pages)
- API: [api.slowcraft.ai](https://api.slowcraft.ai/healthz) (origen Render)
- Admin: [api.slowcraft.ai/admin](https://api.slowcraft.ai/admin) (origen Render)

## Arquitectura

```
┌─────────────────────────┐      ┌─────────────────────────┐
│  GitHub Pages           │      │  Render                 │
│                         │      │                         │
│  index.html             │ ───▶ │  Express API            │
│  (single-file static)   │      │  ├─ POST /api/contact   │
│  + i18n ES/EN           │ ◀─── │  ├─ GET  /api/content   │
│  + dynamic catalogs     │      │  └─ /admin/*  (SPA)     │
│  + GTM/GA4 dataLayer    │      │                         │
└─────────────────────────┘      │  ┌──────────────────┐   │
                                 │  │ Postgres (free)  │   │
                                 │  │  · leads         │   │
                                 │  │  · lead_events   │   │
                                 │  │  · admin_users   │   │
                                 │  │  · content_blocks│   │
                                 │  │  · catalog_sec.  │   │
                                 │  │  · site_settings │   │
                                 │  └──────────────────┘   │
                                 └─────────────────────────┘
                                          │
                                          ▼ HTTP API
                                 ┌─────────────────────────┐
                                 │  Resend (email)         │
                                 └─────────────────────────┘
```

**Stack:**
- **Landing:** HTML estático single-file + CSS in-line con design system v2.0 + JS vanilla (sin build).
- **API:** Express 4 (Node 22 ESM), pg, helmet, cors, express-rate-limit, bcryptjs, jsonwebtoken, cookie-parser.
- **DB:** Postgres en Render (free).
- **Email:** Resend HTTP API (port 443 — Render free bloquea SMTP).
- **Admin:** vanilla HTML/CSS/JS con hash routing, mismo design system que la landing.

## Estructura del repo

```
.
├── index.html                          # Landing single-file
├── docs/
│   └── design-system.html              # Design system de referencia
├── backend/
│   ├── package.json
│   ├── render.yaml                     # Blueprint (web + Postgres)
│   ├── .env.example
│   ├── README.md
│   ├── migrations/                     # SQL idempotentes, runner propio
│   │   ├── 001_init.sql                #   leads + _migrations
│   │   ├── 002_admin.sql               #   lead_events
│   │   ├── 003_admin_users.sql         #   auth en DB
│   │   ├── 004_content_blocks.sql      #   CMS i18n (~140 keys seeded)
│   │   ├── 005_catalogs.sql            #   catalog_sections (programs/serv/fase)
│   │   ├── 006_settings.sql            #   site_settings (analytics)
│   │   ├── 007_analytics_seed.sql      #   pre-fill GA4/GTM IDs
│   │   └── 008_fix_fases_section.sql   #   cleanup secciones fases→metodo
│   └── src/
│       ├── server.js                   # Express + routes públicos
│       ├── db.js                       # Pool pg
│       ├── email.js                    # Resend HTTP API
│       ├── auth.js                     # JWT + bcrypt + middleware
│       ├── migrate.js                  # Runner de migraciones
│       ├── hash-password.js            # CLI para generar bcrypt hash
│       ├── routes/admin.js             # Todos los endpoints /api/admin/*
│       ├── services/
│       │   ├── content.js              # CRUD content_blocks
│       │   ├── catalog.js              # CRUD programs/servicios/fases
│       │   ├── settings.js             # Get/update site_settings
│       │   └── admin-users.js          # Bootstrap + reset password
│       └── public/admin/               # Frontend del admin (SPA-lite)
│           ├── login.html              # con show/hide password
│           ├── forgot.html             # reset por email
│           ├── reset.html              # con token validado
│           ├── dashboard.html          # leads (drawer + timeline + status workflow)
│           ├── content.html            # multi-tab: contenido / formulario / config
│           └── admin.css
├── README.md
├── BACKLOG.md
├── LICENSE                             # Apache 2.0
└── .gitignore
```

## Capacidades

### Landing pública

- **Bilingüe ES/EN** con switcher en nav, persistencia en localStorage, auto-detect de browser
- **Design system v2.0** — paleta extendida (tinta/crema/salvia/cobre/piedra), tipografías Newsreader/Inter/JetBrains Mono, tokens semánticos completos en `:root`
- **Render dinámico de catálogos** — programs/servicios/fases se hidratan desde `/api/content` (con HTML hardcoded como fallback graceful)
- **Formulario de contacto** validado:
  - Nombre completo (debe incluir apellido), email corporativo (bloquea gmail/outlook/etc.), cargo, web, motivo (proyectos/informes/bolsa-de-trabajo), descripción 20-1000 chars
  - Honeypot anti-spam, rate limit servidor, fire-and-forget email
- **CTA WhatsApp** con icono SVG (placeholder hasta widget chat)
- **GTM/GA4 dynamic loading** desde admin → dataLayer events automáticos en CTAs y formulario

### Admin

- **Auth** bcrypt + JWT en cookie httpOnly, 7d expiry, rate limit en login
- **Reset password por email** (token bcrypt-hashed con expiración 30min)
- **Show/hide password** en todos los inputs sensibles
- **Tab Leads** — dashboard con stats por status, filtros (status/motivo/búsqueda), paginación, drawer detail con timeline de eventos (creado, status changes, notas, email_sent/failed)
- **Tab Contenido** con sub-tabs:
  - **General** — editor i18n side-by-side (ES/EN) para nav, hero, tesis, principios, sobre, footer, cabeceras de catálogos
  - **Programs** — CRUD completo (crear, editar, clonar, eliminar) + ítems (módulos) sub-CRUD
  - **Servicios** — CRUD completo + ítems (lista) sub-CRUD
  - **Método** — CRUD completo de fases (título + descripción)
- **Tab Formulario** — gestión combinada de la sección CTA (con labels editables) + campos del formulario (labels, placeholders, opciones del select, botones)
- **Tab Configuración** con sub-tabs:
  - **Analytics y GTM** — GA4 ID + GTM ID, validación inline, status badge, doc completa de eventos disponibles + guía paso a paso de setup en GTM

### Eventos GTM / dataLayer disponibles en la landing

| Evento | Disparado por | Variables |
|---|---|---|
| `cta_click` | Cualquier elemento con `data-gtm-id` | `cta_id`, `cta_text`, `cta_lang` |
| `form_view` | Form entra en viewport | `form_id`, `lang` |
| `form_submit_attempt` | Click en "Enviar mensaje" | `form_id`, `motivo`, `lang` |
| `form_submit_invalid` | Validación cliente falla | `form_id` |
| `form_submit_success` | Backend confirma envío | `form_id`, `motivo`, `lang` |
| `form_submit_error` | Falla envío | `form_id`, `error` |
| `lang_change` | Toggle ES/EN | `from`, `to` |

**`cta_id` actuales:** `cta_nav` · `cta_hero` · `cta_form_submit` · `cta_whatsapp`

## Desarrollo local

### Landing

No requiere build:

```bash
# servidor estático
python3 -m http.server 8000
# abrir http://localhost:8000
```

Por defecto la landing apunta a la API de producción (`https://api.slowcraft.ai`). Para apuntar a backend local, en el `<script>` antes del bundle principal cambiá:

```html
<script>window.SLOWCRAFT_FORM_ENDPOINT = 'http://localhost:8080/api/contact';</script>
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# editá .env con DATABASE_URL local, RESEND_API_KEY, ADMIN_EMAIL, etc.

npm run hash-password -- 'TuPasswordSeguro123'
# copiá el hash a ADMIN_PASSWORD_HASH

node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# copiá a JWT_SECRET

npm run migrate    # corre migraciones contra DB local
npm run dev        # arranca con hot reload en :8080
```

## Deploy

### Landing
GitHub Pages auto-deploya desde `main`. Ver [github.com/rladron-rodia/landing_slowcraft/settings/pages](https://github.com/rladron-rodia/landing_slowcraft/settings/pages).

### Backend
Render Blueprint (`backend/render.yaml`) provisiona web service + Postgres en un click. En cada push a `main`, Render auto-deploya:
1. `npm install`
2. `npm run migrate` (idempotente)
3. `npm start`

**Secrets necesarios en Render → slowcraft-api → Environment:**
- `RESEND_API_KEY` — `re_xxxxxxxxxxxx`
- `CONTACT_TO_EMAIL` — destino de los leads (ej: `hola@slowcraft.ai` o el email de Resend en sandbox)
- `CONTACT_FROM_EMAIL` — remitente (debe ser dominio verificado en Resend, o `onboarding@resend.dev` en sandbox)
- `ADMIN_EMAIL` — email del admin
- `ADMIN_PASSWORD_HASH` — bcrypt hash (generar con `npm run hash-password`)
- `JWT_SECRET` — random hex 48+ bytes

`DATABASE_URL`, `ALLOWED_ORIGINS`, `APP_BASE_URL`, `NODE_ENV` se setean automáticamente desde el Blueprint.

## Versionado

Semver annotated tags. Cada release hace `git tag -a vX.Y.Z -m "..."` + `git push origin vX.Y.Z`.

| Tag | Highlights |
|---|---|
| **v0.1.0** | Baseline — arquitectura visual de la landing |
| **v0.2.0** | Design system v2.0 integrado (tokens completos + JetBrains Mono) |
| **v0.3.0** | Form de contacto + backend Render (Express + Postgres + Resend HTTP API) |
| **v0.4.0** | Admin con auth + dashboard de leads + reset password por email |
| **v0.5.0** | i18n ES/EN completo + UX form polish (spacing + WhatsApp CTA) |
| **v0.6.0** | Catálogos CRUD: Programs/Servicios/Método con altas/bajas/cambios |
| **v0.7.0** | Clone catalog items + CTA labels editables + tab Configuración |
| **v0.8.0** | Estructura nueva de menús + GTM/GA4 dataLayer events + fix fases section |

## Documentación adicional

- [`backend/README.md`](backend/README.md) — Detalle del backend (endpoints, env vars, deploy)
- [`docs/design-system.html`](docs/design-system.html) — Design system canónico (visualizable en browser)
- [`BACKLOG.md`](BACKLOG.md) — Próximas iteraciones y mejoras pendientes

## Licencia

Apache License 2.0 — ver [`LICENSE`](LICENSE).

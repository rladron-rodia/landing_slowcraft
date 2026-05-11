# RUNBOOK — Producto #001 (Landing_Site)

> Operaciones del Template + instance Slowcraft. Setup paso a paso.

**Versión:** v0.1 (Fase A)

---

## Setup local — Stack legacy (lo que sirve hoy slowcraft.ai)

### Frontend (`index.html`)

```bash
# en raíz del repo
python3 -m http.server 8000
open http://localhost:8000
```

Para apuntar a backend local en lugar del de producción, edita en `index.html` la línea:

```html
<script>window.SLOWCRAFT_FORM_ENDPOINT = 'http://localhost:8080/api/contact';</script>
```

### Backend (`backend/`)

```bash
cd backend
npm install
cp .env.example .env

# editar .env: DATABASE_URL, RESEND_API_KEY, ADMIN_EMAIL, etc.

# generar bcrypt hash del admin
npm run hash-password -- 'tu-password-seguro'
# pegar el output en ADMIN_PASSWORD_HASH

# generar JWT secret
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# pegar en JWT_SECRET

# correr migraciones
npm run migrate

# arrancar
npm run dev    # hot reload en :8080
```

URLs locales:
- API: `http://localhost:8080`
- Healthz: `http://localhost:8080/healthz`
- Admin login: `http://localhost:8080/admin/login`

---

## Setup local — Template Next.js (cuando arranque Fase B)

```bash
cd template-next
pnpm install
cp .env.example .env.local

# editar .env.local con NEXT_PUBLIC_CONTACT_ENDPOINT, etc.

pnpm dev
# → http://localhost:3000
```

Build estático:
```bash
pnpm build
# output en template-next/out/ (listo para Cloudflare Pages)
```

Lint + types + check:
```bash
pnpm lint
pnpm typecheck
pnpm test           # cuando haya tests
```

---

## Workflow de desarrollo

### 1. Crear branch

```bash
git checkout main && git pull
git checkout -b feat/<scope>-<short-description>
# ejemplos:
#   feat/contact-form-zod-validation
#   fix/lang-switcher-cookie-domain
#   docs/runbook-cutover-steps
```

### 2. Hacer cambios

Seguir convenciones:
- Código en inglés, comentarios en español.
- Componentes React: `PascalCase.tsx`.
- Utils: `kebab-case.ts`.
- Tests: junto al archivo (`Button.test.tsx`).

### 3. Commit (Conventional Commits)

```bash
git add .
git commit -m "feat(plugins): add Meta Pixel plugin scaffold"
# o usar commitizen
pnpm exec cz
```

Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`.

Pre-commit hook valida:
- commitlint (formato del mensaje).
- gitleaks (no hay secretos en el diff).

### 4. Push + PR

```bash
git push -u origin feat/<scope>-<short-description>
gh pr create --base main --title "..." --body "..."
```

CI corre `check.yml`:
- Lint + types + build sobre `template-next/`.
- Bundlesize check (Fase E).

Cuando los hosting tokens estén configurados, `preview.yml` deploya un preview automático.

### 5. Review + merge

Code review por Rodrigo. Squash merge a `main`.

`release.yml` (Fase E) corre Semantic Release: lee Conventional Commits del merge, calcula bump (`major`/`minor`/`patch`), genera tag + entrada en `platform-docs/CHANGELOG.md` + GitHub Release.

---

## Operación — Producción

### Landing legacy (GitHub Pages, hoy)

- Auto-deploy de `main`.
- Settings → Pages: branch `main`, root.
- URL: `https://rladron-rodia.github.io/landing_slowcraft/`.

### Backend (Render, hoy)

- Auto-deploy de `main` vía `backend/render.yaml`.
- Cada push:
  1. `npm install`
  2. `npm run migrate` (idempotente)
  3. `npm start`

Secrets en Render dashboard → slowcraft-api → Environment:
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
- `JWT_SECRET`
- `DATABASE_URL`, `ALLOWED_ORIGINS`, `APP_BASE_URL`, `NODE_ENV` (auto desde Blueprint)

### Template Next.js (Cloudflare Pages, post-Fase C)

- Conectar repo en Cloudflare Pages.
- Build command: `pnpm install && pnpm --filter template-next build`.
- Output dir: `template-next/out/`.
- Env vars (production):
  - `NEXT_PUBLIC_CONTACT_ENDPOINT=https://api.slowcraft.ai/api/contact`
  - `NEXT_PUBLIC_GA4_ID=G-TJEN2EXGSN`
  - `NEXT_PUBLIC_GTM_ID=GTM-WM6WHTW3`
  - (otros plugins según se activen)

---

## Migración DNS (Fase C)

Pasos para mover `slowcraft.ai` de GoDaddy → Cloudflare:

1. Crear cuenta Cloudflare + agregar zona `slowcraft.ai`.
2. Cambiar nameservers en GoDaddy a los que da Cloudflare. Esperar propagación (24-48h).
3. En Cloudflare DNS:
   - `slowcraft.ai` (apex) → CNAME flatten al deploy de Cloudflare Pages.
   - `www.slowcraft.ai` → CNAME al apex.
   - `api.slowcraft.ai` → CNAME a `slowcraft-api.onrender.com` (necesita custom domain en Render).
4. Verificar SSL Universal activo (automático).
5. En Render → slowcraft-api → Settings → Custom Domain → agregar `api.slowcraft.ai`.
6. Verificar Resend con TXT/MX records de `slowcraft.ai`.
7. Update env vars de Render:
   - `CONTACT_FROM_EMAIL=Slowcraft <noreply@slowcraft.ai>`
   - `CONTACT_TO_EMAIL=hola@slowcraft.ai`
   - `APP_BASE_URL=https://api.slowcraft.ai`
   - `ALLOWED_ORIGINS=https://slowcraft.ai,https://www.slowcraft.ai,https://rladron-rodia.github.io,http://localhost:8000,http://localhost:3000`
8. TTL bajo (300s) durante 24h post-cutover por si hay rollback.

---

## Rollback (Fase C)

Si el cutover a `template-next/` rompe algo:

1. En Cloudflare DNS: cambiar `slowcraft.ai` CNAME de Cloudflare Pages → GitHub Pages (`rladron-rodia.github.io`).
2. Esperar propagación (TTL 300s).
3. Verificar `slowcraft.ai` resuelve al landing legacy.
4. Investigar el problema en `feat/template-migration` o branch nueva.

GitHub Pages debe seguir activo durante 14 días post-cutover (per riesgo Fase 6 del ROADMAP de la Plataforma).

---

## Healthchecks

- Backend: `curl https://api.slowcraft.ai/healthz` → `{"ok":true,...}`
- Landing: `curl -I https://slowcraft.ai` → `HTTP/2 200`
- DB: vía endpoint healthz (hace `SELECT 1`).
- Admin: `curl -I https://api.slowcraft.ai/admin/login` → 200.

Cron warm-up (BACKLOG): cron-job.org cada 14 min `GET /healthz` para evitar cold starts free tier de Render.

---

## Backups DB

- Render free: backups manuales desde dashboard (Postgres → Backups).
- Recomendación: dump diario via `pg_dump` ejecutado por cron-job.org → S3/R2.
- Retención: 30 días para hot, 1 año para cold.

---

## Setup admin desde cero (bootstrap)

1. Setear `ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH` en env vars del backend.
2. Arrancar el backend → `bootstrapFromEnv()` siembra el admin si la tabla `admin_users` está vacía.
3. Login en `/admin/login` con `ADMIN_EMAIL` y el password en claro.
4. Cambiar password vía `/admin/forgot` (envía email con magic link).

---

## Troubleshooting frecuente

### Form llega 500 / no se guarda en DB
- Logs de Render → ver mensaje exacto.
- Si "DB unhealthy": ver Render → slowcraft-db → status (cold start? sin créditos?).
- Si "RESEND error": verificar API key + dominio verificado en Resend.

### Email no llega al destinatario
- Verificar `email_error` column en `leads` table del lead específico.
- Revisar Resend dashboard → Logs.
- Si dominio no verificado en Resend → emails se envían como `onboarding@resend.dev` y van a spam.

### Cold start de Render
- 30-50s primer request tras 15min idle.
- Mitigación: cron warm-up.
- A largo plazo: upgrade a paid tier o migrar a Railway.

### CORS error en admin
- Verificar `ALLOWED_ORIGINS` incluye `APP_BASE_URL`.
- Ver `feedback_render_cors.md` (memoria persistente).

---

*platform-docs/RUNBOOK.md · v0.1 · Producto #001 · 2026-05-10*

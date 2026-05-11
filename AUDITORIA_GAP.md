# AUDITORIA_GAP — Producto #001 (Landing_Site)

> Auditoría de gap entre el landing actual y los contratos de la Plataforma Slowcraft.
> Sigue la estructura de la sección 8 del `handoff-producto-001/BRIEF.md` v1.0.

**Snapshot del repo:** commit `a1a6dd7` en `main` (post-merge handoff)
**Snapshot contractual:** `handoff-producto-001/contractual-snapshot/` 2026-05-10
**Tag actual del landing:** `v0.13.1` (real, según `BACKLOG.md` — no `v0.8.0` como decía el README)
**Fecha de la auditoría:** 2026-05-10
**Auditor:** Claude (Cowork) bajo dirección de Rodrigo

---

## 1. Inventario actual del landing

### 1.1 Stack actual

| Capa | Implementación |
|---|---|
| Frontend público | Single-file `index.html` (~110 KB, 2400+ líneas), CSS in-line, JS vanilla, **sin build step** |
| i18n | Manual: atributos `data-i18n` / `data-i18n-html` + diccionario JS embebido, override por `localStorage`, auto-detect de `navigator.language` |
| Tipografías | True self-hosted en `/fonts/` (8 `.woff2`: Newsreader 400/400i/500, Inter 400/500/600, JetBrains Mono 400/500), preload + `font-display: swap` |
| Render dinámico | Catálogos (programs / servicios / fases) hidratados desde `/api/content` con HTML hardcoded como fallback |
| Form de contacto | HTML + JS vanilla con validación cliente (8 reglas, dominios free bloqueados) + honeypot |
| Backend API | Express 4 (Node ≥22 ESM), `pg`, `helmet`, `cors`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`, `cookie-parser` |
| DB | Postgres en Render free tier (slowcraft-db) |
| Email | **Resend HTTP API** (no SMTP — Render free bloquea 465/587) |
| Admin CMS | HTML/CSS/JS vanilla bajo `backend/src/public/admin/`, hash routing (`#contenido/general`, `#formulario`, `#configuracion/analytics`, etc.) |
| Auth admin | bcrypt + JWT en cookie httpOnly (7d), reset por email, show/hide password |
| Roles admin | `master_admin / admin / viewer / content / commercial / agente` (introducidos en v0.12 / v0.13) |
| Migraciones DB | **12 migraciones SQL idempotentes** con runner propio (`backend/src/migrate.js`) |
| Deploy landing | GitHub Pages desde `main` → `https://rladron-rodia.github.io/landing_slowcraft/` |
| Deploy API + admin | Render Blueprint (`backend/render.yaml`) → `https://slowcraft-api.onrender.com` |
| Dominio público | Pendiente (slowcraft.ai registrado en GoDaddy, no activado) |
| CI/CD | **Ninguno.** No hay `.github/workflows/`. Auto-deploy directo de Render y GitHub Pages al push a `main`. |
| Versionado | Semver con annotated tags (v0.1.0 … v0.13.1). Sin Conventional Commits ni Semantic Release. |
| Lenguaje | **JavaScript** (sin TypeScript) |
| Paquete manager | npm (`backend/package-lock.json`). No pnpm. |
| Observabilidad | Ninguna (no Sentry, no Posthog). Solo `console.log` en backend visible en Render logs. |
| Tests | Ninguno. Solo `npm run lint` = `node --check` sobre 7 archivos JS. |

### 1.2 Estructura de carpetas

```
.
├── index.html                                 (110 KB, single-file landing)
├── 404.html                                   (custom 404 con DS v2.0)
├── README.md                                  (11 KB, doc del repo)
├── BACKLOG.md                                 (6 KB, pendientes)
├── LICENSE                                    (Apache 2.0)
├── robots.txt
├── sitemap.xml
├── monou-vars.sh                              ⚠️ untracked, no commiteado
├── docs/
│   └── design-system.html                     (DS v2.0 visualizable)
├── fonts/                                     (8 .woff2 self-hosted)
├── scripts/
│   └── download-fonts.sh
├── backend/
│   ├── package.json                           (slowcraft-api v0.1.0)
│   ├── render.yaml                            (Blueprint Render)
│   ├── README.md
│   ├── .env.example
│   ├── migrations/                            (001 → 012)
│   └── src/
│       ├── server.js                          (Express, ~265 LOC)
│       ├── db.js                              (Pool pg)
│       ├── email.js                           (Resend HTTP API)
│       ├── auth.js                            (JWT + bcrypt + middleware)
│       ├── migrate.js                         (runner idempotente)
│       ├── hash-password.js
│       ├── routes/admin.js                    (todos los /api/admin/*)
│       ├── services/
│       │   ├── content.js
│       │   ├── catalog.js
│       │   ├── settings.js
│       │   ├── admin-users.js
│       │   ├── analytics.js
│       │   └── users.js
│       └── public/admin/                      (admin SPA-lite vanilla)
│           ├── login.html · forgot.html · reset.html · verify.html
│           ├── dashboard.html · content.html
│           └── admin.css
└── handoff-producto-001/                      (este handoff, recién mergeado)
```

### 1.3 Páginas y rutas

**Landing pública (single-page, scroll secciones):** `nav` · `hero` · `tesis` · `metodo` (#metodo) · `servicios` (#strategy) · `programs` (#programs) · `principios` · `sobre` (#sobre) · `cta-final` (#contacto) · `footer`. Plus `404.html`.

**API pública:** `GET /healthz` · `GET /` · `GET /api/content` · `POST /api/contact`.

**Admin:** rutas estáticas `/admin/{login,forgot,reset,verify,dashboard,content}` + APIs `/api/admin/*`.

### 1.4 Sistema de styling

CSS in-line en `<style>` dentro de `index.html`. Tokens del DS v2.0 declarados en `:root` (color primitives, semantic, type, spacing 1-48, semantic spacing, containers sm-2xl, motion easings/durations). Paleta canónica: `--tinta` `#0F0F0E` · `--crema` `#F5F1EA` · `--salvia` `#3A4F41` · `--cobre` `#A8593D` · `--piedra` `#71665C` (ajustado a WCAG AA). Tipografías: Newsreader (serif) · Inter (sans) · JetBrains Mono. **Cumplimiento de DS v2.0: alto** — los tokens son los canónicos. Lo que falta es portarlos a Tailwind v4 + globals.css del nuevo stack.

### 1.5 Plugins de medición activos hoy

- **GA4** (`G-TJEN2EXGSN`) — pre-seedeado en migración 007, configurable desde admin.
- **GTM** (`GTM-WM6WHTW3`) — toma prioridad cuando está set; routea GA4 + futuros.
- DataLayer events: `cta_click`, `form_view`, `form_submit_attempt|invalid|success|error`, `lang_change`. CTAs con `data-gtm-id`: `cta_nav`, `cta_hero`, `cta_form_submit`, `cta_whatsapp`.
- **No instalados:** Meta Pixel, Search Console, Hotjar, Segment, ningún otro.

### 1.6 i18n actual

ES-MX (default por meta `<html lang="es">`) + EN. Toggle visible en nav, persistencia en localStorage, auto-detect de `navigator.language`. ~140 keys de contenido en `content_blocks` (DB) con `value_es` / `value_en` / `value_type` / `field_label` / `section` / `display_order`. **Sin `next-intl`, sin estructura de mensajes JSON, sin pluralización ICU.**

### 1.7 Deploy actual

```
Landing (estático)  →  GitHub Pages  →  rladron-rodia.github.io/landing_slowcraft
API + admin         →  Render free   →  slowcraft-api.onrender.com
DB                  →  Render free   →  slowcraft-db (Postgres)
Email               →  Resend        →  HTTP API
Dominio público     →  GoDaddy       →  slowcraft.ai NO activado todavía (apunta a slowcraft.ai parking)
```

Cold start de Render free: ~30-50s tras 15 min idle (mitigación pendiente: cron warm-up).

### 1.8 Lo que está bien y vale la pena conservar

- **DS v2.0** — los tokens de color, tipografía y spacing están maduros y validados (WCAG AA). Se portan tal cual al nuevo stack.
- **Schema de DB** — 12 migraciones idempotentes con un dominio rico (leads, lead_events, content_blocks, catalog_sections, site_settings, admin_users, roles, analytics, agents). Es la fuente de verdad operacional de Slowcraft. **Se queda en la instance**, no va al Template.
- **Resend HTTP API** — ya resolvió el problema de Render free bloqueando SMTP. Patrón fire-and-forget con `email_error` en `leads` para retry. Se mantiene.
- **CORS + same-origin** — el backend ya tiene la lógica para mismo-dominio (admin) y allowlist; reutilizable.
- **Validación de form en 2 capas** — cliente + server (Zod-equivalente manual). Migra fácil a Zod con el mismo schema.
- **Honeypot + rate limit** — anti-spam que ya funciona en producción. Se mantiene.
- **GTM/GA4 dataLayer events** — taxonomía de eventos ya pensada y consistente. Se replica 1:1 en el plugin system del Template.
- **SEO** — JSON-LD Organization + LocalBusiness + Service, OG/Twitter cards, hreflang, canonical, sitemap, robots — todo presente y correcto. Se reproduce en metadata API de Next.js.
- **Self-hosted fonts en `/fonts/`** — sin Google tracking, sin DNS lookup externo. Se mueven a `next/font/local`.

---

## 2. Gaps vs los contratos de la Plataforma

Para cada uno de los 7 contratos del snapshot, qué cumple, qué hay pero no cumple, qué falta.

### 2.1 ARCHITECTURE.md

| Requerimiento contractual | Estado | Comentario |
|---|---|---|
| Stack Next.js 15 (App Router) | ❌ No cumple | Hoy es HTML estático single-file |
| React 19 + Tailwind v4 + shadcn/ui | ❌ No cumple | Hoy es CSS in-line + vanilla JS |
| TypeScript estricto | ❌ No cumple | Hoy es JS puro |
| Turborepo + pnpm workspaces | ❌ No cumple | Hoy es npm sin monorepo |
| Supabase (Auth + Postgres + Storage + RLS) | ⚠️ Parcial | Hoy: Postgres en Render con auth bcrypt+JWT. Sin RLS, sin Supabase Auth, sin Storage |
| Server Actions (Next.js) | ❌ No cumple | Hoy: Express routes |
| Inngest para asíncrono | ⚠️ N/A para Template | El Template no necesita asíncrono salvo email; hoy es fire-and-forget |
| Resend + React Email | ⚠️ Parcial | Resend ✓, React Email ✗ (templates HTML hardcoded en `email.js`) |
| Railway o Cloudflare Pages | ❌ No cumple | Hoy GitHub Pages (landing) + Render (API) |
| Cloudflare DNS | ❌ No cumple | Hoy GoDaddy DNS, dominio no activo |
| Observabilidad (Sentry + Posthog) | ❌ No cumple | Sin Sentry, sin Posthog. Solo console.log |
| Multi-tenancy con RLS | ❌ N/A pero crítico para Template | El Template debe diseñarse single-tenant pero compatible con multi-tenancy de la instance |
| Conventional Commits + Semantic Release | ❌ No cumple | Tags semver manuales, mensajes libres |
| 4 GitHub Actions workflows | ❌ No cumple | Cero workflows |
| `product.config.ts` con archetype + compatibility matrix | ❌ No cumple | Inexistente |

**Veredicto ARCHITECTURE: gap mayor.** El stack debe migrarse en paralelo (regla de oro). Es la mayoría del trabajo.

### 2.2 CONVENTIONS.md

| Requerimiento | Estado | Comentario |
|---|---|---|
| Folders + files + vars en inglés | ⚠️ Parcial | Folders ✓, files ✓ mayormente. Vars JS mezcladas (`empresa_web`, `motivo`, `descripcion` en ES; `nombre`, `email` ok) |
| Slugs y URLs en inglés | ⚠️ Parcial | `/api/content`, `/api/contact` ok. Pero IDs de sección en HTML: `#metodo`, `#strategy`, `#programs`, `#sobre`, `#contacto` (mezcla ES) |
| Comentarios en español | ✓ Cumple | Comentarios JS están en ES |
| DB tables/columns en inglés | ⚠️ Parcial | `leads`, `lead_events`, `admin_users` ok. Columnas `nombre`, `cargo`, `empresa_web`, `motivo`, `descripcion` en ES (las acuñó el form actual) |
| `es.json` + `en.json` con next-intl | ❌ No cumple | i18n hoy es manual con DB |
| Display strings vía `useTranslations()` | ❌ No cumple | Hoy `data-i18n` + diccionario JS embebido |
| Conventional Commits | ❌ No cumple | Mensajes libres tipo `feat(admin):`, `fix(catalog):` (siguen el espíritu sin lint) |
| Git branches en inglés | ✓ Cumple | Único branch hoy: `main` |
| Errores con `messageKey` (i18n key) | ❌ No cumple | Errores hardcoded en español en backend y frontend |
| `<PriceTag />` para moneda | ❌ N/A | Landing no tiene pricing visible |
| `useTranslations` con namespaces planos agrupados | ❌ No cumple | Estructura `data-i18n="hero.h1"` ya es plana-agrupada → migra fácil |
| Comentarios con TODO `(autor, fecha)` | ❌ No cumple | TODOs sueltos sin formato |

**Veredicto CONVENTIONS: gap medio.** Se cierra durante la migración a Next.js + next-intl. Decisión a tomar: ¿se renombran columnas de DB de ES→EN (breaking change)? Ver Preguntas Abiertas.

### 2.3 SECURITY.md (10 reglas innegociables)

| # | Regla | Estado | Comentario |
|---|---|---|---|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` jamás en cliente/logs/HTTP | ✓ N/A | No usamos Supabase todavía. Cuando se use, aplica. |
| 2 | Permisos en 3 capas (UI + Server + RLS) | ⚠️ Parcial | UI + Server ✓. RLS ✗ (Postgres directo, no usamos RLS) |
| 3 | RLS en todas las tablas tenant | ❌ No cumple | Single-tenant hoy (Slowcraft propio); cuando vaya a multi-tenant, requerirá rediseño |
| 4 | Audit log obligatorio en eventos críticos | ⚠️ Parcial | `lead_events` cubre leads. No hay `admin_events` (login/logout/password-reset) — está en BACKLOG |
| 5 | `sk_live_*` solo en producción | ✓ N/A | No hay Stripe |
| 6 | Migraciones backward-compatible | ✓ Cumple | Las 12 son idempotentes y aditivas |
| 7 | Secrets solo en env vars | ✓ Cumple | `.env.example` + Render secrets. Pero **no hay gitleaks pre-commit ni GitHub secret scanning** |
| 8 | Webhooks signature-verified | ✓ N/A | No hay webhooks externos |
| 9 | CORS estricto | ✓ Cumple | Allowlist + same-origin documentado |
| 10 | Rate limiting en endpoints sensibles | ⚠️ Parcial | `/api/contact` ✓ (5 req/min). Login ✗ documentado pero hay que verificar implementación |
| Headers de seguridad HTTP | ⚠️ Parcial | helmet ✓ pero `contentSecurityPolicy: false` (necesario para admin inline scripts). Falta CSP estricto en landing |
| Threat model documentado | ❌ No cumple | No documentado |
| MFA para super_admin | ❌ No cumple | No hay MFA |
| `pnpm audit` semanal | ❌ No cumple | Ningún audit programado |
| Validación con Zod | ❌ No cumple | Validación manual en español (custom) |

**Veredicto SECURITY: gap medio-alto.** Mucho está OK por single-tenant, pero la promesa Template impone disciplina mayor (CSP, gitleaks, audit, MFA, Zod).

### 2.4 PERFORMANCE.md

| Métrica / regla | Estado | Comentario |
|---|---|---|
| LCP < 1.5s para Producto Landing (target 95+) | ⚠️ Probable cumple | HTML estático single-file se sirve rápido en GitHub Pages, fonts self-hosted; **falta medición real con Lighthouse y datos RUM** |
| INP < 200ms | ⚠️ Probable cumple | Vanilla JS sin frameworks pesados |
| CLS < 0.05 | ⚠️ Probable cumple | font-display: swap controlado |
| TTFB < 400ms | ⚠️ Riesgo | GitHub Pages global pero `/api/content` desde Render free puede pegar 30s en cold start |
| Bundle JS gzip < 80 KB para landing | ⚠️ Probable cumple | Vanilla JS embebido, sin libs externas. Cuando migre a Next.js hay que cuidar |
| `next/image` para imágenes | ❌ No cumple | Ninguna imagen optimizada (no hay imágenes raster en uso, OG es estática) |
| `next/font` con subsetting | ⚠️ Equivalente | Self-hosted woff2 latin (subsetting manual) |
| Tree-shaking de iconos (Lucide) | ⚠️ N/A | No usamos lib de iconos hoy; SVG inline para WhatsApp |
| Lighthouse CI en cada PR | ❌ No cumple | Sin CI |
| Bundle size check en CI | ❌ No cumple | Sin CI |
| RUM con Posthog Web Vitals | ❌ No cumple | Sin Posthog |

**Veredicto PERFORMANCE: bien posicionado, mal medido.** El single-file HTML probablemente cumple LCP target, pero sin instrumentación no podemos certificar. La migración a Next.js debe nacer con bundle budgets en CI.

### 2.5 PLUGINS.md (sistema de medición del Template)

| Plugin | Estado actual | Estado contractual |
|---|---|---|
| GA4 | ✓ Activado vía admin (`G-TJEN2EXGSN`) | Debe ser env-var driven (`NEXT_PUBLIC_GA4_ID`) en Template |
| GTM | ✓ Activado vía admin (`GTM-WM6WHTW3`) | Debe ser env-var driven (`NEXT_PUBLIC_GTM_ID`) en Template |
| Meta Pixel | ❌ Falta | Plugin del Template (env-var driven) |
| Search Console | ❌ Falta | Plugin del Template (verificación HTML meta o DNS) |
| Hotjar | ❌ Falta | Plugin del Template (env-var driven) |
| Sistema "no env → no script" | ❌ No cumple | Hoy: lee de DB siempre. Hay que invertir: env-var primero, fallback DB para instance Slowcraft |
| Documentación en `platform-docs/PLUGINS.md` | ❌ Falta | Por crear |

**Veredicto PLUGINS: gap definido y acotado.** Es un módulo nuevo, fácil de scaffold. La instance Slowcraft hereda el plugin system y le agrega el CMS DB-driven encima.

### 2.6 DELIVERY.md (modelo de entrega)

| Requerimiento | Estado |
|---|---|
| 8 archivos contractuales en `platform-docs/` | ❌ Inexistente. Por crear. |
| `MIGRATION.md` (cómo el cliente se lleva el fork) | ❌ Crítico, inexistente |
| `CHANGELOG.md` automatizado (Semantic Release) | ❌ Tags manuales |
| `RUNBOOK.md` (cómo correr el Template + instances) | ❌ Inexistente (hay README ✓ y backend/README ✓) |
| `.env.example` del Template | ⚠️ Existe `backend/.env.example` para API. Falta el del Template Next.js |
| Compatibilidad declarada (compat matrix) | ❌ Inexistente |
| Versionado del Template (semver via Semantic Release) | ⚠️ Semver manual hoy. Hay que automatizar |
| Repo transfer flow documentado | ❌ Inexistente |

**Veredicto DELIVERY: gap mayor en docs.** Trabajo de redacción + algo de tooling (Semantic Release). Ningún cambio funcional.

### 2.7 ROADMAP.md (timing y dependencias)

| Hito | Cuándo lo necesita la Plataforma | Estado actual |
|---|---|---|
| Producto #001 listo para Fase 6 (semanas 17-18) | ~Octubre-Noviembre 2026 | Hoy es funcional pero no es Template |
| Validación binaria Fase 6: fork de template < 30s, deploy < 3min, LCP < 1.5s, Lighthouse ≥ 95, MIGRATION.md con instrucciones para Vercel y Railway | Octubre 2026 | Hoy: deploy GH Pages instantáneo pero NO es Template forkeable. Lighthouse no medido. |
| Compatibilidad declarada con Chatbot, Performance Audit, Custom Domain | Fase posterior | No declarada |
| Plataforma deploya la instance Slowcraft a `slowcraft-landing.preview.slowcraft.ai` | Fase 6 | Hoy: instance vive en `slowcraft.ai` (cuando se active dominio) o `rladron-rodia.github.io/landing_slowcraft/` |

**Veredicto ROADMAP: 5-6 meses de margen.** Suficiente tiempo para hacer la migración paralela disciplinada. Bloqueante: en Fase 6 la Plataforma fork-eará el Template — para entonces debe estar listo.

---

## 3. Priorización por riesgo

### P0 — Bloqueantes para ser Template (sin esto, no se puede forkear)

| # | Item | Razón |
|---|---|---|
| P0-1 | Migrar a stack target (Next.js 15 + TS + Tailwind v4 + shadcn/ui + pnpm) | Sin esto, no es el Template del catálogo |
| P0-2 | `brand.config.ts` — única fuente de identidad por instance | Sin esto, fork no puede personalizarse |
| P0-3 | Sistema de plugins de medición env-var driven (GA4, GTM, Meta Pixel, Search Console, Hotjar) | Sin esto, no es activable sin tocar código |
| P0-4 | i18n con `next-intl` (es-MX default + en) | Contrato CONVENTIONS |
| P0-5 | `platform-docs/` con los 8 archivos contractuales (incluye `MIGRATION.md`) | Promesa de portabilidad sin lock-in |
| P0-6 | TypeScript estricto + Zod en todos los inputs | Contrato SECURITY |
| P0-7 | `product.config.ts` con archetype + compat matrix | Contrato ARCHITECTURE / DELIVERY |

### P1 — Necesarios para la primera instance Slowcraft (sin esto, slowcraft.ai sufre)

| # | Item | Razón |
|---|---|---|
| P1-1 | Form de contacto migrado con paridad funcional (mismas reglas, mismo backend) | El form es el único conversion point del sitio |
| P1-2 | DataLayer events conservados 1:1 (`cta_click`, `form_*`, `lang_change`) | Continuidad de medición GA4 |
| P1-3 | Paridad visual con el landing actual (DS v2.0, todas las secciones, todo el copy) | Cero regresión visual en cutover |
| P1-4 | SEO completo (metadata API: OG, Twitter, JSON-LD, canonical, hreflang, sitemap, robots) | No perder posicionamiento |
| P1-5 | Self-hosted fonts portados a `next/font/local` | No degradar performance ni privacidad |
| P1-6 | Dominio `slowcraft.ai` en Cloudflare con SSL (cuando se haga el cutover) | Es lo que cierra el plan de producción del BACKLOG |
| P1-7 | CI/CD mínimo (`check.yml`) corriendo lint + types + build sobre el Template | Antes del cutover, no antes |

### P2 — Recomendados (calidad y disciplina, pueden venir después del cutover)

| # | Item | Razón |
|---|---|---|
| P2-1 | Conventional Commits + Semantic Release + commitlint + husky | Contractual, pero no bloquea funcionalidad |
| P2-2 | `gitleaks` pre-commit + GitHub secret scanning | Mitigación de la amenaza #1 del threat model |
| P2-3 | Sentry para errores cliente + server | Observabilidad mínima |
| P2-4 | Posthog Web Vitals (RUM) | Performance medible |
| P2-5 | Lighthouse CI en preview deploys | Bloquea regresión performance |
| P2-6 | Bundlesize check en CI | Contractual |
| P2-7 | React Email templates (migrar el HTML hardcoded de `email.js`) | DX + consistencia visual |
| P2-8 | CSP estricto en headers | OWASP A05 |
| P2-9 | Audit weekly workflow | Supply chain |

### P3 — Nice-to-have (más adelante)

| # | Item | Razón |
|---|---|---|
| P3-1 | Compatibilidad con `@slowcraft/product-sdk` (cuando exista) | Conexión opcional con la Plataforma |
| P3-2 | Storybook con componentes del Template | Showcase + DX |
| P3-3 | Dark mode (los tokens existen, falta toggle) | BACKLOG |
| P3-4 | Más plugins de medición (Segment, Plausible, Fathom) | Extensibilidad |
| P3-5 | Migración a Supabase + RLS si decidimos unificar DB con la Plataforma | Decisión arquitectónica grande, ver Q1 |
| P3-6 | `agent-engine` integration cuando llegue Fase 5 de la Plataforma | Roadmap futuro |
| P3-7 | Renombrar columnas de DB de ES → EN (`nombre→full_name`, `motivo→reason`, etc.) | Convención. Breaking change. Ver Q3 |

---

## 4. Plan de fases propuesto (sin ejecutar todavía — más detalle en `PROPUESTA_FASES.md`)

### Fase A — Preparación no destructiva (riesgo cero)

**Qué:** Branch `feat/template-migration`. Crear `platform-docs/` con los 8 contractuales. Configurar Conventional Commits + commitlint + husky + gitleaks. Crear `.github/workflows/check.yml` mínimo. **Nada toca `index.html` ni `backend/`. Producción sigue corriendo igual.**

**Riesgo de regresión:** **0.** Solo agrega archivos.

### Fase B — Migración paralela (sub-app `template-next/`)

**Qué:** Crear `template-next/` con Next.js 15 + TS + Tailwind v4 + shadcn/ui + next-intl. Replicar DS v2.0 como tokens Tailwind. Migrar todo el contenido (i18n keys ES + EN) a `messages/*.json`. Implementar `brand.config.ts` con la identidad de Slowcraft. Implementar plugin system env-driven. Migrar todas las secciones del landing como Server Components. Implementar form de contacto (Zod + Server Action) que postea al mismo backend Express actual. Replicar SEO completo (metadata API). Self-hosted fonts vía `next/font/local`. Tests visuales contra el HTML actual.

**Riesgo de regresión:** **0.** Vive en sub-carpeta. `index.html` y `backend/` siguen sirviendo producción sin tocarse.

### Fase C — Cutover validado (un cambio reversible)

**Qué:** Una vez confirmada paridad visual, performance (LCP <1.5s, Lighthouse ≥95) y funcional (form llega a backend igual, dataLayer events disparan igual), deployar `template-next/` a Cloudflare Pages (o Railway). Apuntar `slowcraft.ai` al nuevo deploy desde Cloudflare DNS. Mantener GitHub Pages activo 14 días en paralelo (riesgo del ROADMAP, mitigación documentada). Tag `v1.0.0` (público).

**Riesgo de regresión:** **bajo.** Si algo falla, revert DNS al GH Pages anterior (TTL bajo).

### Fase D — Extracción del Template

**Qué:** Una vez la instance Slowcraft está estable en el nuevo stack, extraer la parte genérica a un repo nuevo `slowcraft-ai/product-landing-site`. La instance se queda como `slowcraft-ai/client-slowcraft-landing` y consume el Template (vía git subtree o submodule, o copia inicial + propagación de updates vía `template_updates`).

**Riesgo de regresión:** **bajo si se hace con disciplina.** Es separación de IP vs instance.

### Fase E — Hardening y documentación contractual

**Qué:** Sentry + Posthog activados. Lighthouse CI bloqueando regresiones. Bundlesize budgets. Audit semanal. CSP estricto. Threat model documentado. `MIGRATION.md` probado de verdad (export funcional). Compat matrix declarada. SDK integration (cuando exista).

**Riesgo de regresión:** **bajo.** Capas adicionales.

---

## 5. Preguntas abiertas para Rodrigo

Decisiones que NO me toca tomar y bloquean (o re-encauzan) la ejecución.

### Q1 — ¿Migramos a Supabase ahora, o seguimos con Postgres+Express en Render?

El BRIEF impone Supabase como contrato de la Plataforma. Pero el landing **no es la Plataforma** — es un Template + instance. La Plataforma es la que orquesta forks y multi-tenancy, no el sitio público de Slowcraft.

- **Opción A — Mantener Postgres+Express en Render.** Mucho menos riesgo. La instance Slowcraft sigue como hoy con su admin CMS, leads, etc. El Template (forkeable) puede tener cero backend y delegar el form a un endpoint configurable por env (`NEXT_PUBLIC_CONTACT_ENDPOINT`).
- **Opción B — Migrar instance a Supabase.** Alinea con la Plataforma desde día 1. Permite RLS, Storage, Auth unificada. Pero es una migración grande con riesgo a lo que ya funciona.
- **Opción C (recomendada por mí) — Híbrido.** El Template nace **sin backend acoplado** (postea a un endpoint env-configurable). La instance Slowcraft sigue posteando al `slowcraft-api.onrender.com` actual. Migración a Supabase queda en P3 cuando la Plataforma esté madura.

**Mi recomendación: Opción C.** Es la que respeta la regla de oro y la separación Template/instance del BRIEF.

### Q2 — Deploy target del Template: Railway, Cloudflare Pages, o ambos como opciones?

El BRIEF dice "cualquiera que soporte preview por PR + custom domains". Para un landing puro SSG, **Cloudflare Pages** es naturalmente más rápido y barato (CDN edge vs container). Pero si más adelante el Template incorpora ISR o Server Actions con secrets, Railway tiene ventaja.

**Recomendación tentativa: Cloudflare Pages para el Template y la instance Slowcraft.** Más simple, más rápido, alineado con que la Plataforma usa Cloudflare para DNS/CDN. Decisión tuya.

### Q3 — ¿Renombrar columnas de DB de ES a EN como pide CONVENTIONS?

Hoy: `nombre`, `cargo`, `empresa_web`, `motivo`, `descripcion`. Contrato: todo en inglés.

- **Opción A — No renombrar.** La DB de la instance Slowcraft es legado, vive así. El Template no toca DB.
- **Opción B — Renombrar con migración + período de transición.** Crear columnas EN, dual-write 2 semanas, cutover, drop columnas ES. Riesgo medio si el admin no actualiza queries a tiempo.
- **Opción C — Renombrar solo en el código nuevo (Template) y aliasear desde la instance.** Mapeo en la capa de Server Action.

**Recomendación tentativa: Opción A.** Es legacy de instance, no de Template. CONVENTIONS aplica a código nuevo. Documentamos la excepción.

### Q4 — ¿El admin CMS (leads + content + catálogos + roles + analytics) viaja al nuevo stack o se queda en `backend/src/public/admin/` como está?

El admin no es parte del Template (es feature de instance). Pero hoy es **vanilla HTML/JS dentro del backend**. Puede:

- **Opción A — Quedarse como está.** Riesgo cero. El admin Express sigue funcionando.
- **Opción B — Migrarse a Next.js como sub-app o ruta protegida del Template.** Más coherencia visual, pero es trabajo grande adicional y no bloquea nada.
- **Opción C — Posponer.** Migrar landing primero (Fases A-C), admin en Fase posterior (D+).

**Recomendación tentativa: Opción C.** Foco en landing primero. Admin queda funcional como está. Si rompe algo: revertir.

### Q5 — Cuándo activar el dominio `slowcraft.ai`?

El BACKLOG dice "Tag `v1.0.0` cuando esté en producción real". El BRIEF distingue:
- `slowcraft.ai` (raíz) = landing público (instance Slowcraft del Template)
- `app.slowcraft.ai` = Mission Control (otro Cowork)
- `hub.slowcraft.ai` = Agency Hub (otro Cowork)

**Pregunta:** ¿activamos `slowcraft.ai` en Cloudflare apuntando al landing nuevo (Fase C), o esperamos a que la Plataforma esté lista para deployar la instance vía Mission Control en Fase 6?

**Recomendación tentativa: Activar en Fase C** (independiente del timing de la Plataforma). El landing público no depende de Mission Control para funcionar.

### Q6 — ¿Confirmas que puedo commitear en branch `feat/template-migration` con Conventional Commits, o quieres revisar cada bloque antes de commitear?

El MENSAJE_INICIAL prohibía commits. Tu mensaje actual los autoriza para "hacer el movimiento". Quiero confirmar el estilo:

- **Opción A — Commits incrementales en branch (recomendado).** Yo hago varios commits Conventional Commits (`chore(repo): add platform-docs scaffold`, `feat(template): scaffold Next.js 15`, etc.). Tú revisas el branch al final.
- **Opción B — Trabajo todo y commiteas tú al final.** Más control, menos historia.

**Recomendación: A.** La historia granular ayuda al code review y es disciplina contractual.

### Q7 — ¿La carpeta `handoff-producto-001/` se queda en `main` o la movemos a `docs/handoff/` o la borramos del repo?

Está commiteada en `main` ahora. Tres opciones:
- Dejarla donde está (queda como referencia histórica del primer handoff).
- Moverla a `docs/handoff-2026-05-10/` para no contaminar la raíz.
- Borrarla de main (queda en historial Git si se necesita).

**Recomendación tentativa: dejarla, moverla a `docs/handoff-2026-05-10/` cuando se regenere el siguiente snapshot.**

---

## 6. Checklist de cierre de la auditoría

- [x] Inventario actual completo y verificado contra el repo (commit `a1a6dd7`).
- [x] Gaps identificados contra los 7 contratos del snapshot.
- [x] Priorización P0/P1/P2/P3 con razones.
- [x] Plan de fases A-B-C-D-E definido.
- [x] Preguntas abiertas escaladas a Rodrigo (Q1-Q7).
- [x] No se commiteó código en esta fase (solo este archivo + `PROPUESTA_FASES.md`).
- [ ] Rodrigo respondió Q1-Q7 — pendiente.
- [ ] Branch `feat/template-migration` abierta — pendiente (próximo paso post-respuestas).

---

*AUDITORIA_GAP.md · v1.0 · Producto #001 (Landing_Site) · 2026-05-10*

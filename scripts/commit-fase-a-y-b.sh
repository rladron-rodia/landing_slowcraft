#!/usr/bin/env bash
# ============================================================================
# Commit script — Fases A + B (Producto #001 Landing_Site)
#
# Ejecuta este script desde la raíz del repo en TU TERMINAL local
# (no en la sesión Cowork). Razón: el sandbox tiene .git/HEAD.lock y
# .git/index.lock que solo tu terminal puede limpiar.
#
# El script:
# 1. Limpia los locks stale.
# 2. Cambia (o crea) al branch feat/template-migration.
# 3. Hace commits separados (Conventional Commits) por bloque lógico.
# 4. NO hace push automático — tú decides cuándo subir.
# ============================================================================

set -euo pipefail

REPO_DIR="/Users/rodrigoladrondeguevaraluna/Documents/Claude/Projects/landing_slowcraft/landing/Desarrollo Landing Slowcraft"

cd "$REPO_DIR"

echo "==> Limpiando locks stale del git..."
rm -f .git/HEAD.lock .git/index.lock

echo "==> Cambiando a feat/template-migration..."
if git show-ref --verify --quiet refs/heads/feat/template-migration; then
  git checkout feat/template-migration
else
  git checkout -b feat/template-migration
fi

echo "==> En branch: $(git branch --show-current)"
echo ""

# ============================================================================
# FASE A
# ============================================================================

# Commit A.1 — auditoría y propuesta
git add AUDITORIA_GAP.md PROPUESTA_FASES.md
git commit -m "docs(repo): add gap audit and migration phases proposal

Auditoría completa del landing actual contra los 7 contratos del
handoff-producto-001. Propuesta de 5 fases (A-E) para migrar a
Template Next.js sin tocar producción.

Refs handoff-producto-001/BRIEF.md sección 8."

# Commit A.2 — platform-docs/
git add platform-docs/
git commit -m "docs(template): scaffold platform-docs with 8 contractual files

- README, ARCHITECTURE, RUNBOOK, CHANGELOG (seed con historia legacy)
- DELIVERY, PLUGINS, MIGRATION (promesa de portabilidad)
- .env.example con todas las env vars del Template

Estos 8 archivos son requeridos por el contrato del BRIEF sección 6
y por el ARCHITECTURE.md de la Plataforma."

# Commit A.3 — Conventional Commits + commitlint + husky + gitleaks
git add package.json .commitlintrc.json .husky/ .gitleaksignore
git commit -m "chore(repo): add commitlint + husky + gitleaks pre-commit

Root package.json con devDeps de husky, commitlint, commitizen.
.husky/commit-msg valida Conventional Commits.
.husky/pre-commit corre gitleaks (warn si no instalado localmente).

CI corre commitlint y gitleaks-action obligatoriamente.

Para activar localmente:
  npm install
  npm run prepare
  brew install gitleaks   # opcional pero recomendado"

# Commit A.4 — GitHub Actions
git add .github/
git commit -m "ci(repo): add baseline GitHub Actions workflows

- check.yml (active): commitlint, gitleaks, backend lint, template-next build
- preview.yml (stub): deploy preview a Cloudflare Pages — requiere secrets
- staging.yml (stub): deploy staging — requiere branch develop
- release.yml (stub): semantic-release — requiere config + deps
- dependabot.yml: scan semanal de actions + npm

Los stubs documentan el flujo esperado y se activan en Fases C/E
cuando estén disponibles las cuentas y secrets."

# Commit A.5 — .gitignore
git add .gitignore
git commit -m "chore(repo): update .gitignore for template-next and local scripts

- template-next/.env.local + .env.production.local
- template-next/out/ + .next/
- monou-vars.sh (script local de devs)
- pnpm store"

# ============================================================================
# FASE B
# ============================================================================

# Commit B.1 — Scaffold Next.js 15 (configs)
git add \
  template-next/package.json \
  template-next/tsconfig.json \
  template-next/next.config.mjs \
  template-next/postcss.config.mjs \
  template-next/components.json \
  template-next/.gitignore \
  template-next/.eslintrc.json \
  template-next/.prettierrc.json \
  template-next/.env.example \
  template-next/README.md
git commit -m "feat(template): scaffold Next.js 15 + TS strict + Tailwind v4 + shadcn/ui

Stack target del Template:
- Next.js 15 con App Router y output: 'export' (Cloudflare Pages SSG).
- React 19 + TypeScript strict (noUncheckedIndexedAccess, etc.).
- Tailwind v4 con @tailwindcss/postcss.
- next-intl para i18n (es-MX default + en, sin localePrefix).
- Zod para validación.
- shadcn/ui configurado (style new-york, neutral, RSC).
- ESLint + Prettier + tailwindcss plugin.

Decisiones arquitectónicas (per AUDITORIA_GAP Q1/Q2):
- Backend desacoplado (form postea a NEXT_PUBLIC_CONTACT_ENDPOINT).
- Static export para Cloudflare Pages."

# Commit B.2 — Self-hosted fonts
git add template-next/public/fonts/
git commit -m "feat(template): add self-hosted fonts (8 woff2)

Newsreader (serif), Inter (sans), JetBrains Mono — copiadas del
landing legacy /fonts/ a template-next/public/fonts/.

Sin Google tracking, sin DNS lookup externo. Servidas desde el mismo
dominio que el landing."

# Commit B.3 — DS v2.0 tokens en globals.css
git add template-next/src/styles/
git commit -m "feat(ds): replicate DS v2.0 tokens as CSS variables + Tailwind v4 theme

- :root con todos los tokens (color primitives, semantic, type, spacing,
  motion) — 1:1 con el index.html legacy.
- @theme de Tailwind v4 expone los colors y fonts a las utility classes
  (bg-crema, text-tinta, font-serif, etc.).
- @font-face para los 8 self-hosted fonts.
- Reset + a11y (focus-visible, prefers-reduced-motion).
- Helpers: .eyebrow, .container-editorial.

Fuente original sigue siendo docs/design-system.html en raíz.
WCAG AA confirmado para piedra/piedra-soft sobre crema."

# Commit B.4 — lib (env, utils, analytics, contact-schema)
git add template-next/src/lib/
git commit -m "feat(template): add lib helpers (env, utils, analytics, contact-schema)

- env.ts: Zod schema de validación de NEXT_PUBLIC_* envs.
- utils.ts: cn() helper (clsx + tailwind-merge).
- analytics.ts: pushDataLayer typed con la taxonomía de eventos del
  landing legacy 1:1 (cta_click, form_*, lang_change).
- contact-schema.ts: Zod del form (mismas reglas que el server actual)
  + mapper EN→ES legacy (toLegacyPayload) para postear al backend Express
  sin romper la DB."

# Commit B.5 — brand.config + product.config
git add template-next/src/brand.config.ts template-next/src/product.config.ts
git commit -m "feat(template): add brand.config.ts and product.config.ts

brand.config.ts: identidad de la instance Slowcraft (name, tagline ES/EN,
domain, contactEmail, whatsapp, social, fonts, address). Único archivo
que cambia por fork del cliente.

product.config.ts: metadata del Producto #001 (archetype digital_presence,
version 0.0.1, compatibleAddons, availableAsAddon: false). Lo consume la
Plataforma vía github-engine post-Fase D."

# Commit B.6 — i18n (next-intl)
git add template-next/src/i18n/ template-next/messages/
git commit -m "feat(i18n): wire next-intl with es-MX default and en mirror

- routing.ts: locales [es-MX, en], localePrefix: 'never' (mismo URL,
  locale por cookie + accept-language fallback).
- request.ts: getRequestConfig que resuelve locale por NEXT_LOCALE cookie
  → accept-language → defaultLocale.
- messages/es.json (canónico): 9 namespaces (nav, hero, tesis, metodo,
  serv, programs, principios, sobre, cta, footer, errors).
- messages/en.json (mirror estructural).

Migración 1:1 del diccionario data-i18n del index.html actual."

# Commit B.7 — Plugin system (medición env-driven)
git add template-next/src/plugins/
git commit -m "feat(plugins): scaffold env-driven measurement plugins

5 plugins, cada uno renderea null si su env var no está set:
- ga4.tsx (NEXT_PUBLIC_GA4_ID) — solo carga si GTM no está set.
- gtm.tsx (NEXT_PUBLIC_GTM_ID) — toma prioridad, routea GA4 desde el container.
- meta-pixel.tsx (NEXT_PUBLIC_META_PIXEL_ID).
- search-console.tsx (NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION) — solo meta tag.
- hotjar.tsx (NEXT_PUBLIC_HOTJAR_ID).

Plugins root <Plugins /> en src/plugins/index.tsx. Cargado en layout.tsx.

Cumple contrato PLUGINS.md: no env → no script. Sin DOM, sin DNS lookup,
sin overhead."

# Commit B.8 — Sections (Server Components)
git add template-next/src/components/sections/
git commit -m "feat(template): migrate landing sections to Server Components

10 secciones del landing legacy migradas a Server Components con i18n:
- nav.tsx (sticky con backdrop-blur, lang switcher, CTA).
- hero.tsx (h1 con t.rich() para <em>).
- tesis.tsx (3 columnas con eyebrow + h2 + bullets).
- metodo.tsx (3 fases, anchor #metodo).
- strategy.tsx (3 services, anchor #strategy).
- programs.tsx (2 programas continuos, anchor #programs).
- principios.tsx (4 principios, fondo tinta).
- sobre.tsx (texto editorial, anchor #sobre).
- contact-cta.tsx (CTA + form + WhatsApp, anchor #contacto).
- footer.tsx.

Todas con utility classes Tailwind que leen tokens del DS v2.0."

# Commit B.9 — Form de contacto + lang switcher (Client Components)
git add template-next/src/components/contact-form.tsx template-next/src/components/lang-switcher.tsx
git commit -m "feat(form): add contact form (Zod + client fetch) and lang switcher

contact-form.tsx (Client Component):
- Zod validation client-side (mismas reglas del server).
- Honeypot 'website' (success silencioso si bot).
- Fetch directo a NEXT_PUBLIC_CONTACT_ENDPOINT (compatible con output: 'export').
- Mapper toLegacyPayload(): el Template usa nombres EN, postea ES legacy.
- DataLayer events: form_view (IntersectionObserver), form_submit_attempt,
  form_submit_invalid, form_submit_success, form_submit_error.
- A11y: labels + role=status/alert + focus-visible.

lang-switcher.tsx (Client Component):
- Cookie NEXT_LOCALE persistente 1 año.
- DataLayer event lang_change (from, to).
- Reload page para que el server re-resuelva el locale."

# Commit B.10 — App router (layout, page, not-found, sitemap, robots)
git add template-next/src/app/ template-next/public/og-image.png.placeholder.txt
git commit -m "feat(template): add app router (layout + page + sitemap + robots)

- layout.tsx: metadata API (title, description, keywords, OG, Twitter,
  hreflang, verification, icons). Inyecta JSON-LD Organization +
  LocalBusiness + WebSite. Plugins root cargado en <body>.
- page.tsx: composición de las 10 secciones.
- not-found.tsx: 404 con DS v2.0.
- sitemap.ts + robots.ts: generados a partir de NEXT_PUBLIC_SITE_URL.
- og-image.png.placeholder.txt: marker para que Rodrigo copie/diseñe el
  asset real (1200x630)."

echo ""
echo "==> ✅ Fases A + B commiteadas en feat/template-migration"
echo ""
echo "==> Diff vs main:"
git log main..HEAD --oneline
echo ""
echo "==> Para subir el branch a GitHub:"
echo "      git push -u origin feat/template-migration"
echo ""
echo "==> Para activar husky + arrancar el Template localmente:"
echo "      npm install                        # root: husky + commitlint"
echo "      npm run prepare                    # husky install"
echo "      cd template-next && pnpm install"
echo "      cp .env.example .env.local         # editar NEXT_PUBLIC_CONTACT_ENDPOINT, etc."
echo "      pnpm dev                           # http://localhost:3000"
echo ""
echo "==> Para verificar build:"
echo "      cd template-next && pnpm build     # genera out/ (Cloudflare Pages-ready)"
echo ""
echo "==> Importante (verificar antes del cutover de Fase C):"
echo "   - index.html y backend/ NO se tocaron — slowcraft.ai sigue corriendo igual."
echo "   - Para que el form en localhost:3000 llegue al backend de prod, el backend"
echo "     necesita 'http://localhost:3000' en ALLOWED_ORIGINS de Render."
echo "     (Si no se quiere modificar prod, levantar el backend local en :8080 y"
echo "      apuntar NEXT_PUBLIC_CONTACT_ENDPOINT=http://localhost:8080/api/contact)."

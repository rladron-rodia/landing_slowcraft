#!/usr/bin/env bash
# ============================================================================
# Commit script — Fase B (template-next/) (Producto #001 Landing_Site)
#
# Ejecuta este script desde la raíz del repo en TU TERMINAL local.
# Asume que Fase A ya está commiteada (los 5 commits previos:
#   954faac docs(repo): add gap audit and migration phases proposal
#   ecd1cb5 docs(template): scaffold platform-docs with 8 contractual files
#   ec01685 chore(repo): add commitlint + husky + gitleaks pre-commit
#   56120a3 ci(repo): add baseline GitHub Actions workflows
#   4869662 chore(repo): update .gitignore for template-next and local scripts
# )
#
# Crea 11 commits granulares Conventional Commits para Fase B.
# NO hace push automático.
# ============================================================================

set -euo pipefail

REPO_DIR="/Users/rodrigoladrondeguevaraluna/Documents/Claude/Projects/landing_slowcraft/landing/Desarrollo Landing Slowcraft"

cd "$REPO_DIR"

echo "==> Limpiando locks stale..."
rm -f .git/HEAD.lock .git/index.lock

echo "==> Verificando branch..."
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "feat/template-migration" ]; then
  echo "==> Cambiando a feat/template-migration desde $CURRENT..."
  git checkout feat/template-migration
fi

# ============================================================================
# Commits para Fase B
# ============================================================================

# Commit B.0 — scripts (auxiliares de migración)
git add scripts/commit-fase-a.sh scripts/commit-fase-a-y-b.sh scripts/commit-fase-b.sh 2>/dev/null || true
git diff --cached --quiet || git commit -m "chore(repo): add commit helper scripts for migration phases

scripts/commit-fase-*.sh ayudan a Rodrigo a hacer commits granulares
desde la sesión Cowork (donde el sandbox no puede limpiar locks de git)."

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
- React 19 + TypeScript strict (noUncheckedIndexedAccess).
- Tailwind v4 con @tailwindcss/postcss.
- next-intl para i18n (es-MX default + en, sin localePrefix).
- Zod para validación.
- shadcn/ui configurado (style new-york, neutral, RSC).
- ESLint + Prettier + tailwindcss plugin.

Decisiones (per AUDITORIA Q1/Q2):
- Backend desacoplado (form postea a NEXT_PUBLIC_CONTACT_ENDPOINT).
- Static export para Cloudflare Pages."

# Commit B.2 — Self-hosted fonts
git add template-next/public/fonts/
git commit -m "feat(template): add self-hosted fonts (8 woff2)

Newsreader (serif), Inter (sans), JetBrains Mono — copiadas del
landing legacy /fonts/ a template-next/public/fonts/.

Sin Google tracking, sin DNS lookup externo."

# Commit B.3 — DS v2.0 tokens en globals.css
git add template-next/src/styles/
git commit -m "feat(ds): replicate DS v2.0 tokens as CSS variables + Tailwind v4 theme

- :root con todos los tokens (color primitives, semantic, type, spacing,
  motion) — 1:1 con el index.html legacy.
- @theme de Tailwind v4 expone colors y fonts a las utility classes
  (bg-crema, text-tinta, font-serif, etc.).
- @font-face para los 8 self-hosted fonts.
- Reset + a11y (focus-visible, prefers-reduced-motion).
- Helpers: .eyebrow, .container-editorial.

WCAG AA confirmado (piedra/piedra-soft sobre crema)."

# Commit B.4 — lib (env, utils, analytics, contact-schema)
git add template-next/src/lib/
git commit -m "feat(template): add lib helpers (env, utils, analytics, contact-schema)

- env.ts: Zod schema de validación de NEXT_PUBLIC_* envs.
- utils.ts: cn() helper (clsx + tailwind-merge).
- analytics.ts: pushDataLayer typed con la taxonomía 1:1 del legacy
  (cta_click, form_*, lang_change).
- contact-schema.ts: Zod del form (mismas reglas del server) + mapper
  EN→ES legacy (toLegacyPayload) para postear al backend Express
  sin romper la DB."

# Commit B.5 — brand.config + product.config
git add template-next/src/brand.config.ts template-next/src/product.config.ts
git commit -m "feat(template): add brand.config.ts and product.config.ts

brand.config.ts: identidad de la instance Slowcraft (name, tagline ES/EN,
domain, contactEmail, whatsapp, social, fonts, address). Único archivo
que cambia por fork del cliente.

product.config.ts: metadata del Producto #001 (archetype digital_presence,
version 0.0.1, compatibleAddons, availableAsAddon: false)."

# Commit B.6 — i18n (next-intl)
git add template-next/src/i18n/ template-next/messages/
git commit -m "feat(i18n): wire next-intl with es-MX default and en mirror

- routing.ts: locales [es-MX, en], localePrefix: 'never'.
- request.ts: getRequestConfig que resuelve locale por NEXT_LOCALE
  cookie → accept-language → defaultLocale.
- messages/es.json (canónico): 9 namespaces.
- messages/en.json (mirror estructural).

Migración 1:1 del diccionario data-i18n del index.html actual."

# Commit B.7 — Plugin system (medición env-driven)
git add template-next/src/plugins/
git commit -m "feat(plugins): scaffold env-driven measurement plugins

5 plugins, cada uno renderea null si su env var no está set:
- ga4.tsx (NEXT_PUBLIC_GA4_ID) — solo carga si GTM no está set.
- gtm.tsx (NEXT_PUBLIC_GTM_ID) — toma prioridad, routea GA4.
- meta-pixel.tsx (NEXT_PUBLIC_META_PIXEL_ID).
- search-console.tsx — solo meta tag (verification).
- hotjar.tsx (NEXT_PUBLIC_HOTJAR_ID).

Cumple PLUGINS.md: no env → no script. Sin DOM, sin DNS lookup."

# Commit B.8 — Sections (Server Components)
git add template-next/src/components/sections/
git commit -m "feat(template): migrate landing sections to Server Components

10 secciones del landing legacy migradas con i18n:
- nav.tsx (sticky, lang switcher, CTA).
- hero.tsx (h1 con t.rich() para <em>).
- tesis.tsx (3 columnas).
- metodo.tsx (3 fases, anchor #metodo).
- strategy.tsx (3 services, anchor #strategy).
- programs.tsx (2 programas continuos, anchor #programs).
- principios.tsx (4 principios, fondo tinta).
- sobre.tsx (anchor #sobre).
- contact-cta.tsx (CTA + form + WhatsApp, anchor #contacto).
- footer.tsx.

Utility classes Tailwind que leen tokens del DS v2.0."

# Commit B.9 — Form de contacto + lang switcher (Client Components)
git add \
  template-next/src/components/contact-form.tsx \
  template-next/src/components/lang-switcher.tsx
git commit -m "feat(form): add contact form (Zod + client fetch) and lang switcher

contact-form.tsx (Client):
- Zod validation client-side (mismas reglas del server).
- Honeypot 'website' (success silencioso si bot).
- Fetch directo a NEXT_PUBLIC_CONTACT_ENDPOINT (compat output: 'export').
- Mapper toLegacyPayload(): el Template usa nombres EN, postea ES legacy.
- DataLayer: form_view (IntersectionObserver), form_submit_attempt,
  form_submit_invalid, form_submit_success, form_submit_error.
- A11y: labels + role=status/alert + focus-visible.

lang-switcher.tsx (Client):
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
- og-image.png.placeholder.txt: marker para asset real (1200x630)."

echo ""
echo "==> ✅ Fase B commiteada en feat/template-migration"
echo ""
echo "==> Diff vs main:"
git log main..HEAD --oneline
echo ""
echo "==> SHA-256 de index.html:"
sha256sum index.html
git show main:index.html | sha256sum
echo "(deben ser iguales — index.html intocado)"
echo ""
echo "==> Para subir a GitHub:"
echo "      git push -u origin feat/template-migration"
echo ""
echo "==> Para arrancar el Template localmente:"
echo "      npm install                        # root: husky + commitlint"
echo "      npm run prepare                    # husky install"
echo "      cd template-next && pnpm install"
echo "      cp .env.example .env.local         # editar NEXT_PUBLIC_CONTACT_ENDPOINT"
echo "      pnpm dev                           # http://localhost:3000"
echo ""
echo "==> Para verificar build estático:"
echo "      cd template-next && pnpm build     # genera out/ (Cloudflare-ready)"
echo ""
echo "==> Importante para que el form en localhost funcione contra prod:"
echo "   El backend Express en Render necesita 'http://localhost:3000' en"
echo "   ALLOWED_ORIGINS. Si no quieres tocar prod, usa el backend local:"
echo "      cd backend && npm run dev          # :8080"
echo "      # luego en template-next/.env.local:"
echo "      # NEXT_PUBLIC_CONTACT_ENDPOINT=http://localhost:8080/api/contact"

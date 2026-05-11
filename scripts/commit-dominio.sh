#!/usr/bin/env bash
# ============================================================================
# Commit script — Activación de dominio slowcraft.ai
#
# Asume Fases A + B ya commiteadas. Hace 4 commits granulares para los
# cambios de dominio + commitea los lockfiles si están untracked.
# ============================================================================

set -euo pipefail

REPO_DIR="/Users/rodrigoladrondeguevaraluna/Documents/Claude/Projects/landing_slowcraft/landing/Desarrollo Landing Slowcraft"

cd "$REPO_DIR"

echo "==> Limpiando locks stale + artefactos sed..."
rm -f .git/HEAD.lock .git/index.lock
rm -f *.tmp *.bak.preDomain
echo "    artefactos eliminados:"
ls *.tmp *.bak.preDomain 2>&1 | grep -v "No such" || echo "    (limpio)"

echo "==> Verificando branch..."
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "feat/template-migration" ]; then
  echo "==> Cambiando a feat/template-migration desde $CURRENT..."
  git checkout feat/template-migration
fi

echo "==> Estado actual:"
git status --short
echo ""

# ============================================================================
# Commits del dominio
# ============================================================================

# Commit D.1 — lockfiles (si untracked)
git add package-lock.json template-next/pnpm-lock.yaml template-next/pnpm-workspace.yaml 2>/dev/null || true
if ! git diff --cached --quiet; then
  git commit -m "chore(deps): commit lockfiles after install (root npm + template-next pnpm)

Reproducibilidad de dependencias:
- Root: husky, commitlint, commitizen.
- template-next: Next.js 15, React 19, next-intl, zod, Tailwind v4, etc."
else
  echo "    (sin lockfiles untracked, salto)"
fi

# Commit D.2 — index.html, 404, sitemap, robots con URLs nuevas
git add index.html 404.html sitemap.xml robots.txt
git commit -m "feat(seo)!: switch all canonical URLs to slowcraft.ai

BREAKING CHANGE: el sitio público ahora vive en slowcraft.ai en lugar de
rladron-rodia.github.io/landing_slowcraft/. Requiere DNS configurado per
ACTIVAR_DOMINIO.md.

Cambios:
- canonical, og:url, twitter:image, hreflang (3) → https://slowcraft.ai/.
- JSON-LD @id y url (8) → https://slowcraft.ai/#... .
- Form endpoint (window.SLOWCRAFT_FORM_ENDPOINT) → https://api.slowcraft.ai/api/contact.
- preconnect → https://api.slowcraft.ai.
- 404.html canonical → https://slowcraft.ai/.
- sitemap.xml URLs → https://slowcraft.ai/.
- robots.txt sitemap → https://slowcraft.ai/sitemap.xml."

# Commit D.3 — CNAME para GitHub Pages
git add CNAME
git commit -m "feat(seo): add CNAME file for GitHub Pages custom domain

GitHub Pages lee el CNAME en raíz al deploy y configura el custom domain
'slowcraft.ai' automáticamente. Equivalente a Settings → Pages →
Custom domain (queda persistido en repo)."

# Commit D.4 — backend/.env.example + .gitignore + README + BACKLOG
git add backend/.env.example .gitignore README.md BACKLOG.md
git commit -m "chore(backend): document new env vars for slowcraft.ai cutover

backend/.env.example:
- APP_BASE_URL → https://api.slowcraft.ai (con nota legacy).
- ALLOWED_ORIGINS → incluye slowcraft.ai, www.slowcraft.ai, GitHub Pages
  legacy (rollback), localhost:8000 (server estático), localhost:3000
  (Next dev).
- CONTACT_FROM/TO_EMAIL → mantienen slowcraft.ai con nota de verificación
  Resend en ACTIVAR_DOMINIO.md sección 4.

.gitignore: agregar *.tmp y *.bak.* (artefactos de sed durante migraciones).

README.md: URLs de Live actualizadas (slowcraft.ai + api.slowcraft.ai).
BACKLOG.md: marcar progreso del item 'Configurar dominio real slowcraft.ai'."

# Commit D.5 — guía de activación
git add ACTIVAR_DOMINIO.md
git commit -m "docs(repo): add ACTIVAR_DOMINIO.md step-by-step checklist

Guía completa para activar slowcraft.ai apex + www + api.slowcraft.ai
manteniendo DNS en GoDaddy:
- Pre-flight checklist con accesos requeridos.
- 1. GoDaddy DNS (4 A records apex, www CNAME, api CNAME).
- 2. GitHub Pages custom domain + Enforce HTTPS.
- 3. Render custom domain + env vars updates.
- 4. Resend domain verification (DKIM, SPF, DMARC).
- 5. Update env vars locales para devs.
- 6. Smoke tests post-cutover (curl + Lighthouse + OG cards).
- 7. Rollback procedure.
- 8. Tag v0.14.0 + comunicación.
- 9. Coordinación con Fase C (cutover a template-next/ Cloudflare Pages)."

echo ""
echo "==> ✅ Cambios de dominio commiteados"
echo ""
echo "==> Diff vs main (resumen):"
git log main..HEAD --oneline
echo ""
echo "==> Para subir el branch a GitHub:"
echo "      git push -u origin feat/template-migration"
echo ""
echo "==> Próximos pasos manuales (siguen ACTIVAR_DOMINIO.md):"
echo "   1. Login a GoDaddy → DNS Management de slowcraft.ai → agregar 4 A records,"
echo "      2 CNAME (www, api) y los records de Resend."
echo "   2. Login a GitHub → Settings → Pages → Custom domain: slowcraft.ai."
echo "   3. Login a Render → slowcraft-api → Custom Domain: api.slowcraft.ai +"
echo "      actualizar env vars (APP_BASE_URL, ALLOWED_ORIGINS, CONTACT_*)."
echo "   4. Login a Resend → Domains → Add slowcraft.ai → verificar DNS."
echo "   5. Validar con curls y Lighthouse (sección 6 del .md)."
echo "   6. Tag v0.14.0 cuando todo esté live."

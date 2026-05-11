#!/usr/bin/env bash
# ============================================================================
# Commit script — Fase A (Producto #001 Landing_Site)
#
# Ejecuta este script desde la raíz del repo en TU TERMINAL local
# (no en la sesión Cowork). Razón: el sandbox tiene .git/HEAD.lock y
# .git/index.lock que solo tu terminal puede limpiar.
#
# El script:
# 1. Limpia los locks stale.
# 2. Verifica que estás en main.
# 3. Cambia (o crea) al branch feat/template-migration.
# 4. Hace commits separados (Conventional Commits) por bloque lógico.
# 5. NO hace push automático — tú decides cuándo subir.
# ============================================================================

set -euo pipefail

REPO_DIR="/Users/rodrigoladrondeguevaraluna/Documents/Claude/Projects/landing_slowcraft/landing/Desarrollo Landing Slowcraft"

cd "$REPO_DIR"

echo "==> Limpiando locks stale del git..."
rm -f .git/HEAD.lock .git/index.lock

echo "==> Verificando estado..."
git status --short

echo ""
echo "==> Cambiando a feat/template-migration..."
if git show-ref --verify --quiet refs/heads/feat/template-migration; then
  git checkout feat/template-migration
else
  git checkout -b feat/template-migration
fi

echo "==> En branch: $(git branch --show-current)"
echo ""

# ----------------------------------------------------------------------------
# Commit 1 — auditoría y propuesta de fases (planning)
# ----------------------------------------------------------------------------
git add AUDITORIA_GAP.md PROPUESTA_FASES.md
git commit -m "docs(repo): add gap audit and migration phases proposal

Auditoría completa del landing actual contra los 7 contratos del
handoff-producto-001. Propuesta de 5 fases (A-E) para migrar a
Template Next.js sin tocar producción.

Refs handoff-producto-001/BRIEF.md sección 8."

# ----------------------------------------------------------------------------
# Commit 2 — platform-docs/ (8 archivos contractuales del Template)
# ----------------------------------------------------------------------------
git add platform-docs/
git commit -m "docs(template): scaffold platform-docs with 8 contractual files

- README, ARCHITECTURE, RUNBOOK, CHANGELOG (seed con historia legacy)
- DELIVERY, PLUGINS, MIGRATION (promesa de portabilidad)
- .env.example con todas las env vars del Template

Estos 8 archivos son requeridos por el contrato del BRIEF sección 6
y por el ARCHITECTURE.md de la Plataforma."

# ----------------------------------------------------------------------------
# Commit 3 — Conventional Commits + commitlint + husky + gitleaks
# ----------------------------------------------------------------------------
git add package.json .commitlintrc.json .husky/ .gitleaksignore
git commit -m "chore(repo): add commitlint + husky + gitleaks pre-commit

Root package.json con devDeps de husky, commitlint, commitizen.
.husky/commit-msg valida Conventional Commits.
.husky/pre-commit corre gitleaks (warn si no instalado localmente).

CI corre commitlint y gitleaks-action obligatoriamente.

Para activar localmente:
  npm install
  npm run prepare    # husky install
  brew install gitleaks   # opcional pero recomendado"

# ----------------------------------------------------------------------------
# Commit 4 — GitHub Actions baseline
# ----------------------------------------------------------------------------
git add .github/
git commit -m "ci(repo): add baseline GitHub Actions workflows

- check.yml (active): commitlint, gitleaks, backend lint, template-next build (cuando exista)
- preview.yml (stub): deploy preview a Cloudflare Pages — requiere secrets
- staging.yml (stub): deploy staging — requiere branch develop
- release.yml (stub): semantic-release — requiere config + deps
- dependabot.yml: scan semanal de actions + npm

Los stubs documentan el flujo esperado y se activan en Fases C/E
cuando estén disponibles las cuentas y secrets."

# ----------------------------------------------------------------------------
# Commit 5 — .gitignore updates (template-next outputs, monou-vars.sh)
# ----------------------------------------------------------------------------
git add .gitignore
git commit -m "chore(repo): update .gitignore for template-next and local scripts

- template-next/.env.local + .env.production.local
- template-next/out/ + .next/
- monou-vars.sh (script local de devs)
- pnpm store"

echo ""
echo "==> ✅ Fase A commiteada en feat/template-migration"
echo ""
echo "==> Diff vs main:"
git log main..HEAD --oneline
echo ""
echo "==> Para subir el branch a GitHub:"
echo "      git push -u origin feat/template-migration"
echo ""
echo "==> Para activar husky localmente:"
echo "      npm install"
echo "      npm run prepare"
echo ""
echo "==> Para revisar la auditoría y la propuesta:"
echo "      open AUDITORIA_GAP.md PROPUESTA_FASES.md"

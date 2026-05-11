# CHANGELOG — Producto #001 (Landing_Site)

> Historial de versiones del Producto #001.
> Hasta v0.13.x: tags semver manuales del repo legacy.
> Desde v1.0.0: auto-generado por Semantic Release a partir de Conventional Commits.

Formato: [Keep a Changelog](https://keepachangelog.com/) · Versionado: [SemVer](https://semver.org/).

---

## [Unreleased] — Migración a Template (branch `feat/template-migration`)

### Added
- `AUDITORIA_GAP.md` y `PROPUESTA_FASES.md` en raíz (planning de migración).
- `handoff-producto-001/` con BRIEF + contractual-snapshot del 2026-05-10.
- `platform-docs/` con los 8 archivos contractuales del Template (README, ARCHITECTURE, RUNBOOK, CHANGELOG, DELIVERY, PLUGINS, MIGRATION, .env.example).
- `.commitlintrc.json` + `.husky/` (commitlint + gitleaks pre-commit).
- `.github/workflows/check.yml` (lint + types + build cuando exista template-next/).
- `.github/dependabot.yml` (npm + actions semanal).

### Changed
- README actualizado con arquitectura objetivo + roadmap de migración.

### Notes
Este bloque se cierra al merge de Fase C (cutover) con tag `v1.0.0`.

---

## [0.13.1] — 2026-05-XX (legacy, fecha del tag)

Mobile-first admin: top nav y sub-tabs swipeables, tablas con scroll horizontal sangrado, charts apilan, drawer/modal/forms adaptados, breakpoint extra ≤480px.

## [0.13.0] — 2026-05-XX (legacy)

Rol `agente` + asignación de leads + tab Analítica con charts reales (Chart.js) + filtros por agente.

## [0.12.0] — 2026-05-XX (legacy)

Sistema de usuarios y roles (master_admin/admin/viewer/content/commercial) + invitación por email con verificación + tab Usuarios + tab Analítica con propuesta de dashboards + role-based UI filtering + read-only mode.

## [0.11.0] — 2026-05-XX (legacy)

WhatsApp config administrable (slug renombrado + business label + mode futuro chatbot) + true self-hosted fonts en /fonts/.

## [0.10.0] — 2026-05-XX (legacy)

Fonts vía jsdelivr CDN (sin Google tracking) + WCAG AA contrast (piedra/piedra-soft ajustados) + script para true self-hosting opcional.

## [0.9.0] — 2026-05-XX (legacy)

SEO completo (OG, Twitter, Schema JSON-LD, robots, sitemap, hreflang) + a11y (focus-visible, prefers-reduced-motion) + favicon SVG + 404 personalizada + WhatsApp/social administrables.

## [0.8.0] — 2026-05-XX (legacy)

Nueva jerarquía menús + GTM events + fix fases bug.

## [0.7.0] — 2026-05-XX (legacy)

Clone catalog items + CTA labels editables + tab Configuración (Analytics/GTM) + fix cache landing.

## [0.6.0] — 2026-05-XX (legacy)

Catálogos CRUD: Programs/Servicios/Método con altas/bajas/cambios + items sub-CRUD.

## [0.5.0] — 2026-05-XX (legacy)

i18n ES/EN completo + UX form polish (spacing + WhatsApp CTA).

## [0.4.0] — 2026-05-XX (legacy)

Admin con auth + dashboard de leads + reset password por email.

## [0.3.0] — 2026-05-XX (legacy)

Form de contacto + backend Render (Express + Postgres + Resend HTTP API).

## [0.2.0] — 2026-05-08 (legacy)

Design system v2.0 integrado (tokens completos + JetBrains Mono).

## [0.1.0] — 2026-05-07 (legacy)

Baseline arquitectura visual de la landing.

---

*platform-docs/CHANGELOG.md · seed v0.1 — la fila Unreleased se llena en cada PR; las pasadas se mantienen como referencia histórica.*

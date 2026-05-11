# Producto #001 — Landing_Site (Template + instance Slowcraft)

> Repositorio del **Producto #001** del catálogo de la Plataforma Slowcraft.
> Contiene el **Template** (`product-landing-site`, IP de Slowcraft) y, durante la transición, también la **instance Slowcraft** (`client-slowcraft-landing`) que sirve `slowcraft.ai`.

**Versión actual:** v0.13.1 (legacy single-file) → en migración a v1.0.0 (Template Next.js)
**Snapshot del handoff:** 2026-05-10
**Ver:** `AUDITORIA_GAP.md`, `PROPUESTA_FASES.md` en raíz del repo.

---

## Quick start

### Landing legacy (lo que sirve `slowcraft.ai` hoy)

```bash
# servidor estático local
python3 -m http.server 8000
# abrir http://localhost:8000
```

Sin build. Single-file `index.html`. No tocar mientras la migración está activa.

### Backend API + admin (Render → `slowcraft-api.onrender.com`)

```bash
cd backend
npm install
cp .env.example .env
# editar .env con DATABASE_URL local, RESEND_API_KEY, ADMIN_EMAIL, etc.
npm run hash-password -- 'TuPasswordSeguro123'
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run migrate
npm run dev
```

### Template Next.js (en construcción, branch `feat/template-migration`)

```bash
cd template-next
pnpm install
pnpm dev
# → http://localhost:3000
```

(disponible cuando arranque Fase B — ver `PROPUESTA_FASES.md`).

---

## Estructura

```
.
├── index.html                      # Landing legacy (sirve slowcraft.ai hoy)
├── 404.html                        # 404 legacy
├── docs/                           # DS v2.0 visualizable
├── fonts/                          # 8 .woff2 self-hosted
├── scripts/                        # download-fonts.sh
├── backend/                        # Express + Postgres + admin (Render)
├── template-next/                  # ⭐ Template Next.js 15 (branch migration)
├── platform-docs/                  # ⭐ 8 archivos contractuales (este folder)
├── .github/workflows/              # ⭐ CI/CD
├── handoff-producto-001/           # Handoff inicial de la Plataforma (2026-05-10)
├── AUDITORIA_GAP.md                # ⭐ Auditoría de gap vs contratos
├── PROPUESTA_FASES.md              # ⭐ Plan de ejecución por fases
├── README.md                       # Doc del repo (público)
└── BACKLOG.md                      # Pendientes
```

---

## Documentación contractual (este folder)

| Archivo | Propósito |
|---|---|
| `README.md` | Este archivo. Quick start del Template y referencias |
| `ARCHITECTURE.md` | Stack del Template, decisiones, ADRs aplicables |
| `RUNBOOK.md` | Setup paso a paso (local → preview → staging → producción) |
| `CHANGELOG.md` | Historial de versiones (auto-generado por Semantic Release post-Fase C) |
| `DELIVERY.md` | Qué entrega el Template a cada instance y al cliente final |
| `PLUGINS.md` | Catálogo de plugins de medición (GA4, GTM, Meta Pixel, Search Console, Hotjar) |
| `MIGRATION.md` | Cómo un cliente se lleva su fork (export & migrate) |
| `.env.example` | Variables del Template (NEXT_PUBLIC_* + server) |

---

## Estado de migración

Ver `PROPUESTA_FASES.md` para el plan completo. Resumen:

| Fase | Estado |
|---|---|
| A — Preparación no destructiva | 🟡 En curso (este commit) |
| B — Migración paralela (`template-next/`) | ⏳ Pendiente decisiones Q1, Q2, Q4 |
| C — Cutover validado a `slowcraft.ai` | ⏳ Pendiente B + decisión Q5 |
| D — Extracción del Template a repo separado | ⏳ Pendiente Plataforma Fase 4-5 |
| E — Hardening + observabilidad | ⏳ Pendiente cuentas externas |

---

## Convenciones

- **Idiomas:** código en inglés, documentación en español, UI bilingüe es-MX/en (ver CONVENTIONS de la Plataforma).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`).
- **Branches:** `feat/`, `fix/`, `chore/`, `docs/` + slug en inglés.
- **Tags:** semver via Semantic Release (post-Fase C). Hoy: anotados manuales (`v0.13.1` legacy).
- **Secrets:** nunca en el repo. `.env.example` con placeholders. Pre-commit hook con gitleaks bloquea leaks.

---

## Owner

- **Rodrigo Ladrón de Guevara** — `rladron@gmail.com`
- Repo: https://github.com/rladron-rodia/landing_slowcraft
- Origen del handoff: proyecto Cowork "Plataforma de Productos Slowcraft"

---

*platform-docs/README.md · v0.1 · Producto #001 · 2026-05-10*

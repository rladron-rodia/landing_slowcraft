# ARCHITECTURE — Producto #001 (Landing_Site)

> Stack del Template, decisiones técnicas, ADRs aplicables.
> Derivado de `handoff-producto-001/contractual-snapshot/ARCHITECTURE.md` v1.0 (Plataforma).

**Versión:** v0.1 (Fase A)
**Estado:** documentación viva — se actualiza con cada decisión técnica del Template.

---

## 1. Visión

El Producto #001 es el **primer Template del catálogo Slowcraft**. Cumple **doble rol** durante la transición:

1. **Sitio público de Slowcraft** (`slowcraft.ai`) — instance permanente del Template.
2. **Template forkeable** para futuros clientes que necesiten un landing similar.

Después de Fase D (extracción), vivirá como dos repos separados:
- `slowcraft-ai/product-landing-site` — el Template (IP de Slowcraft).
- `slowcraft-ai/client-slowcraft-landing` — la instance Slowcraft (transferible).

---

## 2. Stack tecnológico

### Stack legacy (lo que sirve hoy `slowcraft.ai` — vive hasta Fase C)

| Capa | Tecnología |
|---|---|
| Frontend público | `index.html` single-file, CSS in-line, JS vanilla, sin build |
| Backend API | Express 4 (Node ≥22 ESM) en Render |
| DB | Postgres en Render (free tier) |
| Email | Resend HTTP API |
| Hosting landing | GitHub Pages |
| Hosting API + admin | Render |
| Dominio | GitHub Pages domain (slowcraft.ai pendiente) |

### Stack target (Template Next.js — `template-next/`, post-Fase B)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSG + opcional ISR |
| Lenguaje | TypeScript estricto | `strict: true`, sin `any` sin justificar |
| UI | React 19 + Tailwind v4 + shadcn/ui | Tokens DS v2.0 |
| i18n | `next-intl` | es-MX default + en |
| Validación | Zod | Inputs, formularios, env vars |
| Email | Resend HTTP API + React Email | (post-Fase E) |
| Form backend | Server Action que postea al Express actual | Vía `NEXT_PUBLIC_CONTACT_ENDPOINT` |
| Plugin system | Env-var driven | GA4, GTM, Meta Pixel, Search Console, Hotjar |
| Deploy | Cloudflare Pages (recomendación) | Static export. Decisión Q2 pendiente. |
| DNS | Cloudflare | Migración desde GoDaddy en Fase C |
| CI/CD | GitHub Actions | check.yml activo en A; preview/staging/release en C-E |
| Observabilidad | Sentry + Posthog | Activación en Fase E |
| Convenciones commits | Conventional Commits + Semantic Release | Activo desde Fase A (commitlint) |
| Package manager | pnpm | Para template-next/. Backend legacy sigue con npm |

---

## 3. Estructura del Template (`template-next/`)

```
template-next/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
├── components.json
├── messages/
│   ├── es.json
│   └── en.json
├── public/
│   ├── fonts/                              # 8 .woff2 self-hosted
│   ├── og-image.png
│   └── favicon-180.png
└── src/
    ├── brand.config.ts                     # Identidad de la instance (Slowcraft hoy)
    ├── product.config.ts                   # Archetype + version + compat matrix
    ├── i18n/
    │   ├── routing.ts
    │   └── request.ts
    ├── plugins/
    │   ├── ga4.tsx · gtm.tsx · meta-pixel.tsx · search-console.tsx · hotjar.tsx
    │   └── index.tsx                       # <Plugins /> root con env guards
    ├── lib/
    │   ├── env.ts                          # Zod schema de envs
    │   ├── analytics.ts                    # dataLayer push helper
    │   └── contact-schema.ts               # Zod schema del form
    ├── components/
    │   ├── ui/                             # shadcn/ui primitives
    │   ├── nav.tsx · hero.tsx · ...        # Secciones del landing
    │   ├── contact-form.tsx
    │   └── lang-switcher.tsx
    ├── actions/
    │   └── submit-contact.ts               # Server Action → endpoint configurable
    ├── styles/
    │   └── globals.css                     # DS v2.0 tokens en :root
    └── app/
        ├── layout.tsx                      # metadata API: OG, Twitter, JSON-LD, hreflang
        ├── page.tsx                        # landing principal
        └── not-found.tsx                   # 404 con DS v2.0
```

---

## 4. Diagrama del flujo (post-Fase C)

```
┌─────────────────────────────────────────┐
│  Cloudflare DNS + CDN                   │
│   slowcraft.ai → Cloudflare Pages       │
│   api.slowcraft.ai → Render (API)       │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐         ┌────────────────┐
│ Cloudflare   │         │ Render         │
│ Pages        │ ───POST▶│ Express API    │
│ (Next.js     │  /api/  │ ├─ /contact    │
│  static      │ contact │ ├─ /content    │
│  export)     │         │ └─ /admin      │
└──────────────┘         │   ┌──────────┐ │
                         │   │ Postgres │ │
                         │   │ (Render) │ │
                         │   └──────────┘ │
                         └────────────────┘
                                  │
                                  ▼
                            ┌──────────┐
                            │  Resend  │
                            │ (HTTP)   │
                            └──────────┘
```

El **Template** (Next.js) y el **backend** (Express + DB) son ahora dos sistemas **desacoplados**. El form del Template postea a un endpoint configurable por env (`NEXT_PUBLIC_CONTACT_ENDPOINT`). Para la instance Slowcraft, ese endpoint es `https://api.slowcraft.ai/api/contact`.

Para futuros forks del Template, cada cliente puede:
- Apuntar a su propio backend (Supabase, Vercel functions, etc.).
- O dejar el form como `mailto:`.
- O usar un Form Service externo (Formspree, Tally, etc.) — decisión del cliente.

---

## 5. Decisiones arquitectónicas (ADRs locales del Template)

Los ADRs canónicos viven en la Plataforma (`handoff-producto-001/contractual-snapshot/ARCHITECTURE.md` sección 15). Aquí se documentan los que aplican al Template + los específicos del Producto #001.

| # | Decisión | Estado |
|---|---|---|
| L001 | Migración paralela (no destructiva) en sub-carpeta `template-next/` | ✅ Adoptada (PROPUESTA_FASES Fase B) |
| L002 | Form del Template desacoplado del backend (endpoint env-var) | 🟡 Propuesta — pendiente Q1 |
| L003 | Backend legacy Express + Postgres se mantiene en Render para la instance Slowcraft | 🟡 Propuesta — pendiente Q1 |
| L004 | Cloudflare Pages como deploy target del Template | 🟡 Propuesta — pendiente Q2 |
| L005 | Plugin system de medición env-var driven (no DB-driven) | ✅ Adoptada (contrato PLUGINS) |
| L006 | Static Site Generation (SSG) para el landing — sin SSR ni ISR en MVP | ✅ Adoptada (performance) |
| L007 | next-intl con routing no localizado (mismo URL, locale por cookie) | 🟡 Propuesta — alterativa: `/es/` y `/en/` (decidir con primera revisión) |
| L008 | Self-hosted fonts vía `next/font/local` (preserva hoy) | ✅ Adoptada |
| L009 | Columnas DB en español NO se renombran (legado de instance) | 🟡 Propuesta — pendiente Q3 |
| L010 | Admin CMS legacy (vanilla HTML/JS bajo backend/) NO se migra a Next.js en MVP | 🟡 Propuesta — pendiente Q4 |

---

## 6. Performance budgets aplicables al Template

Del contrato PERFORMANCE.md sección 3.4 (Productos del cliente):

| Métrica | Target |
|---|---|
| LCP | < 1.5s |
| INP | < 200ms |
| CLS | < 0.05 |
| TTFB | < 400ms |
| Lighthouse Performance | ≥ 95 |
| Bundle inicial JS gzip | < 80 KB |
| Bundle inicial CSS gzip | < 20 KB |
| Total page weight | < 500 KB |

Verificación en CI: Lighthouse CI + bundlesize. Fase E.

---

## 7. Seguridad aplicable al Template

Del contrato SECURITY.md, lo que aplica a un sitio público estático:

- ✅ Secrets nunca en repo. `.env.example` con placeholders. gitleaks pre-commit (Fase A).
- ✅ Inputs validados con Zod (form de contacto).
- ✅ CORS estricto en backend (ya existe en Express).
- ✅ Rate limiting en `/api/contact` (ya existe).
- ⏳ CSP estricto (Fase E).
- ⏳ Headers HSTS, X-Frame-Options DENY, etc. (Fase E vía middleware o Cloudflare Pages headers).
- ⏳ `pnpm audit` semanal vía GitHub Actions cron (Fase E).

---

## 8. Referencias

- `handoff-producto-001/BRIEF.md` — contexto autocontenido.
- `handoff-producto-001/contractual-snapshot/ARCHITECTURE.md` — arquitectura de la Plataforma.
- `AUDITORIA_GAP.md` — gap actual vs contratos.
- `PROPUESTA_FASES.md` — plan de ejecución.

---

*platform-docs/ARCHITECTURE.md · v0.1 · Producto #001 · 2026-05-10*

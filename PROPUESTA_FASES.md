# PROPUESTA_FASES — Producto #001 (Landing_Site)

> Plan de ejecución concreto derivado de `AUDITORIA_GAP.md` sección 4.
> Cada fase entrega algo demostrable, mantiene `slowcraft.ai` corriendo, y es revertible.

**Snapshot:** 2026-05-10
**Branch propuesto:** `feat/template-migration`
**Regla de oro:** `main` no se toca hasta el cutover de Fase C.

---

## Resumen ejecutivo

| Fase | Nombre | Branch / scope | Producción afectada | Bloqueante |
|---|---|---|---|---|
| **A** | Preparación no destructiva | `feat/template-migration` (solo agrega archivos) | No | Confirmación Q6 |
| **B** | Migración paralela | `feat/template-migration` (sub-app `template-next/`) | No | Q1, Q2, Q4 |
| **C** | Cutover validado | Merge a `main` + DNS Cloudflare | Sí — controlado, revertible | Q5, paridad demostrada |
| **D** | Extracción del Template | Repo nuevo `slowcraft-ai/product-landing-site` | No (instance ya estable) | Plataforma lista |
| **E** | Hardening + observabilidad | Branches por feature | No | Cuentas Sentry/Posthog |

---

## Fase A — Preparación no destructiva

**Objetivo:** Sentar el andamiaje contractual sin tocar el código que sirve `slowcraft.ai`.

**Branch:** `feat/template-migration` (creado al inicio de A; vivo hasta merge en C).

### A.1 Crear branch

```bash
git checkout main && git pull
git checkout -b feat/template-migration
```

### A.2 `platform-docs/` con los 8 archivos contractuales

```
platform-docs/
├── README.md           Quick start del Template + cómo se forkea
├── ARCHITECTURE.md     Stack del Template, decisiones, ADRs aplicables
├── RUNBOOK.md          Setup paso a paso (local → preview → prod)
├── CHANGELOG.md        (auto-generado por Semantic Release a partir de C)
├── DELIVERY.md         Qué entrega el Template a cada instance
├── PLUGINS.md          GA4, GTM, Meta Pixel, Search Console, Hotjar
├── MIGRATION.md        Cómo el cliente se lleva el fork (CRÍTICO)
└── .env.example        Variables del Template (NEXT_PUBLIC_* y server-only)
```

Esqueletos llenos con el contexto actual + TODOs marcados para lo que necesita info externa.

### A.3 Conventional Commits + commitlint + husky + gitleaks

- Root `package.json` (devDeps): `husky`, `@commitlint/cli`, `@commitlint/config-conventional`, `commitizen`.
- `.commitlintrc.json` con reglas estándar.
- `.husky/commit-msg` → commitlint.
- `.husky/pre-commit` → gitleaks (binario descargado o `gitleaks/gitleaks-action`).
- `.gitleaksignore` para falsos positivos conocidos.

### A.4 GitHub Actions

```
.github/
├── workflows/
│   ├── check.yml       Lint + types + build de template-next/ (cuando exista)
│   ├── preview.yml     Stub documentado, requiere Cloudflare/Railway token
│   ├── staging.yml     Stub documentado
│   └── release.yml     Stub documentado, requiere Semantic Release setup
└── dependabot.yml      npm + actions semanal
```

Solo `check.yml` activo en A. Los otros se llenan en C/E cuando tengamos las cuentas.

### A.5 Limpieza

- Mover `monou-vars.sh` a `.gitignore` o eliminarlo (untracked hoy).
- Mover `handoff-producto-001/` → `docs/handoff-2026-05-10/` (decisión Q7).

### Entregable de A

- PR draft con todos los archivos de A (~10-15 commits Conventional Commits).
- `slowcraft.ai` sigue funcionando idéntico.
- `npm run` en `backend/` sigue funcionando idéntico.

### Validación binaria de A

- [ ] `git diff main..feat/template-migration -- index.html backend/` está **vacío**.
- [ ] `git diff main..feat/template-migration -- platform-docs/ .github/ .commitlintrc.json .husky/` muestra todos los archivos nuevos.
- [ ] CI `check.yml` corre verde (aún no hay nada que linter, pasa trivialmente).
- [ ] Pre-commit hook bloquea un commit que incluya un secreto fake (`AKIAEXAMPLEAWSKEY`).
- [ ] GitHub Pages sigue deployando desde `main` sin cambios.

**Tiempo estimado:** 1 día de trabajo (mío).

---

## Fase B — Migración paralela

**Objetivo:** Construir el Template Next.js completo en `template-next/`, con paridad visual y funcional con el landing actual, sin tocar producción.

### B.1 Scaffold

```
template-next/
├── package.json            (pnpm; "engines": node >=22)
├── pnpm-lock.yaml
├── tsconfig.json           (strict: true, sin any sin justificar)
├── next.config.mjs         (output static export para Cloudflare Pages)
├── tailwind.config.ts      (tokens DS v2.0, content paths)
├── postcss.config.mjs
├── .env.example            (mismas variables que platform-docs/.env.example)
├── components.json         (shadcn/ui)
├── messages/
│   ├── es.json             (canónico)
│   └── en.json             (mirror estructural)
├── public/
│   ├── fonts/              (los 8 .woff2 actuales)
│   ├── og-image.png        (cuando exista)
│   ├── favicon-180.png
│   └── robots.txt + sitemap.xml (generados o estáticos)
└── src/
    ├── brand.config.ts     (identidad de la instance Slowcraft)
    ├── product.config.ts   (archetype, version, compat matrix)
    ├── i18n/
    │   ├── routing.ts
    │   └── request.ts
    ├── plugins/
    │   ├── ga4.tsx
    │   ├── gtm.tsx
    │   ├── meta-pixel.tsx
    │   ├── search-console.tsx
    │   ├── hotjar.tsx
    │   └── index.tsx        (Plugins root con env-var guards)
    ├── lib/
    │   ├── env.ts           (Zod schema de envs públicas y server)
    │   ├── analytics.ts     (dataLayer push helper)
    │   └── utils.ts
    ├── components/
    │   ├── ui/              (shadcn/ui primitives instalados)
    │   ├── nav.tsx
    │   ├── hero.tsx
    │   ├── tesis.tsx
    │   ├── metodo.tsx
    │   ├── strategy.tsx
    │   ├── programs.tsx
    │   ├── principios.tsx
    │   ├── sobre.tsx
    │   ├── contact-cta.tsx
    │   ├── contact-form.tsx (Server Action + Zod)
    │   ├── footer.tsx
    │   └── lang-switcher.tsx
    ├── actions/
    │   └── submit-contact.ts (Server Action que llama API actual)
    ├── styles/
    │   └── globals.css      (DS v2.0 tokens en :root)
    └── app/
        ├── layout.tsx       (metadata API: OG, Twitter, JSON-LD, hreflang)
        ├── page.tsx         (landing principal)
        ├── not-found.tsx    (404 con DS v2.0)
        ├── opengraph-image.tsx (opcional)
        └── api/             (vacío por ahora — el form llama al backend Express)
```

### B.2 Replicar DS v2.0 en Tailwind v4

`tailwind.config.ts` mapea los tokens `--tinta`, `--crema`, `--salvia`, `--cobre`, `--piedra`, `--success`, `--warning`, `--danger`, `--info`, además de la escala de spacing 1-48 y los containers sm-2xl.

`globals.css` declara `:root { ... }` con todos los CSS variables (1:1 con el `index.html` actual). Tailwind v4 los consume nativamente.

### B.3 i18n

Migración de los `data-i18n` keys del `index.html`:

```
data-i18n="hero.h1"        → t('hero.h1')
data-i18n-html="hero.h1"   → t.rich('hero.h1', { em: (chunks) => <em>{chunks}</em> })
```

Generar `messages/es.json` y `messages/en.json` con todas las strings actuales (ES de los `data-i18n` defaults + EN del diccionario JS). Validación CI: `es.json` y `en.json` tienen el mismo árbol de keys.

### B.4 brand.config.ts

```typescript
import type { BrandConfig } from './lib/types'

export const brand: BrandConfig = {
  name: 'Slowcraft',
  legalName: 'Slowcraft Strategy & Programs',
  tagline: { es: 'Estrategia AI, deliberadamente diseñada.', en: 'AI Strategy, deliberately designed.' },
  domain: 'slowcraft.ai',
  contactEmail: 'hola@slowcraft.ai',
  whatsappNumber: '+52...', // de la DB actual
  social: { /* LinkedIn, X, etc cuando se sumen */ },
  fonts: {
    serif: 'Newsreader',
    sans: 'Inter',
    mono: 'JetBrains Mono',
  },
  // colors no van aquí; viven en globals.css como CSS vars del DS v2.0
}
```

### B.5 Plugin system de medición (env-driven)

Cada plugin: componente que renderea sus scripts si y solo si la env var está set. Cargados en `<Plugins />` dentro de `app/layout.tsx`.

```typescript
// src/plugins/index.tsx
export function Plugins() {
  return (
    <>
      <Ga4 />          {/* renderiza si NEXT_PUBLIC_GA4_ID */}
      <Gtm />          {/* renderiza si NEXT_PUBLIC_GTM_ID */}
      <MetaPixel />    {/* renderiza si NEXT_PUBLIC_META_PIXEL_ID */}
      <SearchConsole />{/* renderiza si NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION */}
      <Hotjar />       {/* renderiza si NEXT_PUBLIC_HOTJAR_ID */}
    </>
  )
}
```

Para la instance Slowcraft: las env vars se pueblan desde el actual `site_settings` table en `slowcraft-api` durante el build (script `next build` con `prebuild` que llama `/api/content` y exporta a `.env.production.local`). Vía no-acoplada con la DB.

### B.6 Migración de secciones

Cada sección del `index.html` se traduce a un componente Server. Estructura visual idéntica (mismo HTML, ahora JSX), CSS migrado a Tailwind classes que usan los tokens DS.

Componentes interactivos como Client Components puros:
- `<LangSwitcher />` (lee/escribe cookie + dispara dataLayer event `lang_change`).
- `<ContactForm />` (estado local + validación cliente + submit a Server Action).
- `<ScrollSpy />` para nav active state si se quiere (opcional).

Resto: Server Components con SSG.

### B.7 Form de contacto

```typescript
// src/lib/contact-schema.ts (Zod, mismo schema que el server actual)
export const contactSchema = z.object({
  fullName: z.string().min(3).max(80).refine(s => /\s/.test(s)),
  email: z.string().email().refine(notFreeDomain),
  jobTitle: z.string().min(2).max(80),
  companyWebsite: z.string().refine(isValidDomain),
  reason: z.enum(['proyectos', 'informes', 'bolsa-de-trabajo']),
  description: z.string().min(20).max(1000),
})
```

```typescript
// src/actions/submit-contact.ts
'use server'
export async function submitContact(input: unknown) {
  const data = contactSchema.parse(input)
  const endpoint = process.env.CONTACT_ENDPOINT || 'https://slowcraft-api.onrender.com/api/contact'
  const res = await fetch(endpoint, { /* postea con shape ES legacy via mapper */ })
  // dataLayer events disparados desde el cliente al recibir respuesta
}
```

Mapper ES↔EN para no romper la DB legacy: el Template usa nombres EN, el Server Action mapea a `nombre/email/cargo/empresa_web/motivo/descripcion` antes de postear al backend Express.

### B.8 SEO completo

`app/layout.tsx` con `metadata` de Next.js: title, description, OG, Twitter, JSON-LD, canonical, hreflang. `app/sitemap.ts` y `app/robots.ts` (generados). 1:1 con `index.html` actual.

### B.9 Self-hosted fonts

`next/font/local` con los 8 `.woff2` que ya están en `/fonts/`. Subsetting + preload + display swap.

### Entregable de B

- `template-next/` arrancable con `pnpm dev`, sirviendo el landing en `localhost:3000`.
- Paridad visual demostrable con screenshots side-by-side contra `index.html` actual.
- `pnpm build` produce static export en `template-next/out/` listo para Cloudflare Pages.
- Form funcional contra el backend de producción (sin migrar backend).

### Validación binaria de B

- [ ] `pnpm typecheck` pasa con strict.
- [ ] `pnpm build` produce `out/` válido.
- [ ] Lighthouse local sobre el build: Performance ≥ 95, LCP < 1.5s, CLS < 0.05.
- [ ] Bundle inicial JS gzip < 80 KB (PERFORMANCE.md target para Producto Landing).
- [ ] `messages/es.json` y `messages/en.json` tienen árboles iguales (test CI).
- [ ] Form posteado en `localhost:3000` aparece en la DB de producción de Slowcraft (mismo backend) y dispara el email Resend.
- [ ] dataLayer events idénticos a los actuales (`cta_click`, `form_*`, `lang_change`).
- [ ] Switcher ES/EN funciona y persiste cookie.
- [ ] `index.html` y `backend/` siguen sin cambios (`git diff main`).
- [ ] GitHub Pages y Render siguen sirviendo idéntico.

**Tiempo estimado:** 3-5 días de trabajo (mío).

---

## Fase C — Cutover validado

**Objetivo:** Pasar `slowcraft.ai` del landing actual al `template-next/` con riesgo bajo y revertibilidad alta.

### C.1 Setup de hosting

- Crear proyecto en Cloudflare Pages (o Railway, según Q2) conectado al branch `feat/template-migration`.
- Subdomain provisional: `template-next.slowcraft.ai` (preview público).
- Validar SSL automático.

### C.2 Smoke testing en preview

- Lighthouse sobre el preview público: targets cumplidos.
- Form enviado desde preview llega al backend y se ve en admin de leads.
- GA4 / GTM eventos llegan al stream en vivo.
- Test de SEO con Google Search Console URL Inspection.

### C.3 Migración DNS

- Migrar DNS de GoDaddy a Cloudflare (per BACKLOG: ya planeado).
- En Cloudflare:
  - Apex `slowcraft.ai` → CNAME flatten al deploy de Cloudflare Pages.
  - `www.slowcraft.ai` → CNAME al apex.
  - `api.slowcraft.ai` → CNAME a `slowcraft-api.onrender.com` (custom domain en Render). Backend NO se mueve.
- TTL bajo (300s) durante 24h por si hay rollback.

### C.4 Merge a main

- PR `feat/template-migration` → `main`. Code review por Rodrigo.
- Squash merge (commit de Semantic Release: `feat!: migrate landing to Next.js template architecture`).
- Tag `v1.0.0`.

### C.5 Convivencia 14 días

GitHub Pages sigue activo con el `index.html` viejo bajo `https://rladron-rodia.github.io/landing_slowcraft/` (ya está). Si el cutover falla, DNS revert ofrece fallback en minutos.

### Validación binaria de C

- [ ] `slowcraft.ai` resuelve al nuevo deploy con HTTPS válido.
- [ ] Lighthouse sobre `slowcraft.ai`: Performance ≥ 95, todos los Core Web Vitals dentro de PERFORMANCE.md.
- [ ] Form enviado desde `slowcraft.ai` llega al admin de Slowcraft.
- [ ] dataLayer events visibles en GA4 stream y GTM debug.
- [ ] No hay errores 4xx/5xx en logs Cloudflare durante las primeras 24h.
- [ ] OG cards renderean correctamente en LinkedIn / Twitter / WhatsApp share.
- [ ] `git tag v1.0.0` aplicado y pusheado.

**Tiempo estimado:** 1 día (cutover) + 14 días de monitoreo pasivo.

---

## Fase D — Extracción del Template

**Objetivo:** Separar lo Slowcraft-específico (instance) de lo genérico (Template).

### D.1 Decisión de patrón

- **Opción D.a — Dos repos.** `slowcraft-ai/product-landing-site` (Template) + `slowcraft-ai/client-slowcraft-landing` (instance, fork del Template). Patrón canónico del BRIEF.
- **Opción D.b — Monorepo con `template/` y `instances/slowcraft/`.** Más simple operacionalmente al inicio.
- **Opción D.c — Posponer hasta que la Plataforma esté lista para forkear.** El Template vive como `template-next/` en este repo hasta entonces.

Recomendación: **D.c** para Fase D (no urge). **D.a** cuando la Plataforma esté en Fase 4-5.

### D.2 Si D.a: extracción

- Mover `template-next/` a un repo nuevo `slowcraft-ai/product-landing-site` (preservando historia con `git filter-repo`).
- Eliminar de él: `brand.config.ts` (Slowcraft-específico) → reemplazar con `brand.example.ts`.
- Eliminar: `messages/es.json` / `en.json` con copy específico → reemplazar con placeholders + docs.
- En `client-slowcraft-landing`: fork del Template + sobreescritura de `brand.config.ts` y `messages/*.json` con el contenido de Slowcraft.

### Entregable de D

- Repo `product-landing-site` clonable + forkeable.
- Repo `client-slowcraft-landing` deployable como hoy.
- `MIGRATION.md` del Template probado al exportar la instance.

**Tiempo estimado:** 2-3 días cuando se decida ejecutar.

---

## Fase E — Hardening + observabilidad

**Objetivo:** Cerrar los gaps P2 y P3 y dejar el Template listo para auditoría.

- E.1 Sentry (errores cliente + server) — requiere DSNs.
- E.2 Posthog Web Vitals (RUM) — requiere project key.
- E.3 Lighthouse CI bloqueando regresiones en preview.
- E.4 Bundlesize check en CI.
- E.5 Audit semanal (`pnpm audit`).
- E.6 CSP estricto en headers.
- E.7 React Email templates (migrar HTML hardcoded).
- E.8 Threat model documentado.
- E.9 MFA para admins (cuando se migre el admin a Next.js).
- E.10 Storybook con componentes del Template.

**Tiempo estimado:** 5-7 días distribuidos en branches por feature.

---

## Dependencias entre fases

```
A ──┬──► B ──► C (cutover) ──► D (extracción) ──► E (hardening)
    │
    └──► E.1, E.4, E.5 también pueden empezar en paralelo si los DSNs/keys están disponibles.
```

**Hard blockers:**
- B necesita respuestas a Q1, Q2, Q4 (decide forma del scaffold).
- C necesita Q5 (cuándo activar dominio) + paridad demostrada en B.
- D necesita la Plataforma en estado de poder forkear (Fase 4+ del ROADMAP de la Plataforma).

**Soft blockers:**
- E necesita cuentas externas (Sentry, Posthog, Cloudflare account, etc.) → coordinación contigo.

---

## Coordinación con la Plataforma

Cosas que pediré al otro Cowork (Plataforma) en el momento que toque:

1. **Cuando exista `@slowcraft/product-sdk`:** docs del package + cómo se conecta + qué reporta (deploys, métricas, status). Va en `template-next/src/lib/platform-sdk.ts`.
2. **Cuando exista `@slowcraft/tokens`:** swap de los CSS vars locales por consumo del package.
3. **Cuando exista `packages/i18n` compartido:** swap de `next-intl` puro por el wrapper compartido.
4. **Lista oficial de env vars** que la Plataforma inyecta en cada fork (formato + nombres).
5. **Schema del fork** que `github-engine` espera (qué carpetas, qué archivos contractuales, `MIGRATION.md` template).

---

## Cómo seguimos

1. Tú lees este doc + `AUDITORIA_GAP.md`.
2. Respondes Q1-Q7.
3. Yo arranco Fase A inmediatamente (no necesita decisiones — es solo agregar archivos).
4. Cuando A esté hecha, paso a B con tus decisiones aplicadas.
5. C y siguientes con check-in tuyo en cada gate.

---

*PROPUESTA_FASES.md · v1.0 · Producto #001 (Landing_Site) · 2026-05-10*

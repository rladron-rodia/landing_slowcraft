# DELIVERY — Producto #001 (Landing_Site)

> Qué entrega este Producto a cada instance del cliente y, eventualmente, al cliente final.

**Versión:** v0.1 (Fase A)

---

## 1. Naturaleza del entregable

A diferencia de la **Plataforma Slowcraft** (no transferible, IP permanente), el **Producto #001** es **transferible al cliente** bajo solicitud.

Cada instance es un fork del Template `product-landing-site` (cuando exista en Fase D). El cliente recibe:
- Código completo del fork.
- Dump de DB (si la instance usa DB propia — opcional para landing).
- `MIGRATION.md` con instrucciones para deployar la instance fuera de Slowcraft.

Hasta Fase D, el "Template" y la "instance Slowcraft" viven en el mismo repo. La separación es el objetivo de Fase D.

---

## 2. Qué incluye una instance del Producto #001

### 2.1 Código

```
client-<slug>-landing/
├── package.json              (versión semver)
├── pnpm-lock.yaml
├── tsconfig.json · next.config.mjs · tailwind.config.ts · postcss.config.mjs
├── messages/                 (es.json + en.json customizados con copy del cliente)
├── public/                   (fonts + favicon + og-image custom)
├── src/
│   ├── brand.config.ts       (identidad del cliente: logo, paleta, tipos)
│   ├── product.config.ts     (archetype + version + compat matrix)
│   ├── components/           (secciones del landing)
│   ├── plugins/              (GA4, GTM, Meta Pixel — env-driven)
│   ├── lib/ · actions/ · styles/ · app/
└── platform-docs/            (los 8 contractuales, customizados)
    ├── README.md
    ├── ARCHITECTURE.md
    ├── RUNBOOK.md
    ├── CHANGELOG.md
    ├── DELIVERY.md
    ├── PLUGINS.md
    ├── MIGRATION.md          ← clave para portabilidad
    └── .env.example
```

### 2.2 Funcionalidades estándar

- Landing público SSG, multi-section, configurable por copy.
- Bilingüe es/en con `next-intl` (extensible a más locales).
- Plugin system de medición (5 plugins activables por env vars).
- Form de contacto con validación Zod (Server Action).
- SEO completo: metadata API, OG, Twitter, JSON-LD, sitemap, robots, hreflang.
- Self-hosted fonts (sin tracking de terceros).
- Performance: SSG static export, LCP <1.5s, Lighthouse ≥95.

### 2.3 Funcionalidades opcionales (instance-specific)

- Backend para form (Express+Postgres como Slowcraft, o Supabase, o servicio externo).
- Admin CMS para gestionar copy + leads (la instance Slowcraft lo tiene; otras instances pueden no tenerlo).
- Catálogos dinámicos (programs/servicios/fases) si el cliente los necesita.

### 2.4 Compatibility matrix

```typescript
// src/product.config.ts (instance Slowcraft)
export const product = {
  name: 'Landing_Site',
  slug: 'landing-site',
  archetype: 'digital_presence',
  version: '1.0.0',
  compatibleAddons: ['ai-chatbot', 'perf-seo-audit', 'custom-domain'],
  availableAsAddon: false,
}
```

Cuando un cliente activa Producto #001, la Plataforma valida que los add-ons solicitados estén en `compatibleAddons`.

---

## 3. Flujo de entrega (post-Fase D, cuando la Plataforma orqueste)

```
1. Consultor activa Producto #001 para Cliente Acme en Agency Hub.
2. github-engine forkea: slowcraft-ai/product-landing-site → slowcraft-ai/client-acme-landing.
3. Agente personaliza el fork:
   - brand.config.ts con datos de Acme.
   - messages/es.json + en.json con copy de Acme.
   - public/og-image.png con asset de Acme.
   - .env vars de Cloudflare Pages con plugins seleccionados.
4. CI/CD del fork (heredado del Template) deploya a:
   - acme-landing.preview.slowcraft.ai (preview).
   - acme-landing.slowcraft.ai (cuando se aprueba).
   - acme.com (cuando se configura custom domain).
5. Consultor revisa, aprueba.
6. Agente regenera/verifica los 8 archivos contractuales (incluido MIGRATION.md customizado).
7. Cuando Acme solicita transfer:
   - github-engine ejecuta repo transfer a la org GitHub de Acme.
   - Acme recibe: código + (opcional) dump DB + checklist DNS/SSL.
8. Acme puede deployar en Vercel, Railway, Cloudflare Pages, o su propio infra.
```

Hasta Fase D, este flujo es manual.

---

## 4. Promesa de portabilidad

El Template es **portable sin lock-in**:

- Código standalone con stacks estándar (Next.js, React, Tailwind).
- Sin dependencia hard de servicios Slowcraft (la conexión al `@slowcraft/product-sdk`, cuando exista, es opcional).
- DB exportable con `pg_dump` estándar.
- Documentación de migración (`MIGRATION.md`) probada en CI con un test de smoke deploy en Vercel.

Esta promesa es **diferenciadora**. Webflow, HubSpot CMS, Wix no la cumplen — el cliente queda atado a la plataforma.

---

## 5. Versionado del Producto

- Semver: `MAJOR.MINOR.PATCH`.
- Auto-generado por Semantic Release a partir de Conventional Commits del Template.
- `MAJOR`: cambios incompatibles (ej. nueva env var requerida; rename de `brand.config.ts` field).
- `MINOR`: features nuevas backward-compatible (ej. plugin nuevo opcional).
- `PATCH`: fixes y mejoras menores (ej. fix de typo en copy default).

---

## 6. Propagación de mejoras a forks (post-Fase D)

Cuando el Template publica una versión nueva, `github-engine` (Plataforma) genera PRs en cada fork activo:

| Severidad | Comportamiento |
|---|---|
| `patch` (1.0.X) | Auto-merge tras CI verde (configurable por instance). |
| `minor` (1.X.0) | Requiere aprobación del consultor. |
| `major` (X.0.0) | Alerta crítica + revisión obligatoria + posible MIGRATION.md adicional. |

Cada propagación queda en `template_updates` table (Plataforma).

---

## 7. Métricas de la versión

Cada release reporta (post-Fase E):

| Métrica | Target |
|---|---|
| Bundle inicial JS gzip | < 80 KB |
| Bundle inicial CSS gzip | < 20 KB |
| Total page weight | < 500 KB |
| Lighthouse Performance | ≥ 95 |
| LCP p75 mobile 4G | < 1.5s |
| Cobertura de tests | ≥ 60% |

Las métricas reales se capturan en CI (Lighthouse CI + bundlesize) y se pueblan en `CHANGELOG.md` por release.

---

## 8. Próximos entregables planeados

| Versión | Hito | ETA tentativo |
|---|---|---|
| `0.14.0` (legacy o `0.0.1` en `template-next/`) | Fase A completa: platform-docs + CI baseline | 2026-05-XX |
| `0.0.1` template-next | Fase B completa: scaffold con paridad visual | 2026-05-XX |
| `1.0.0` | Fase C completa: cutover a slowcraft.ai en Cloudflare | 2026-06-XX |
| `1.1.0` | Fase D: extracción a repo `product-landing-site` | Cuando Plataforma esté en Fase 4 |
| `1.2.0` | Fase E: hardening (Sentry, Posthog, CSP, audit weekly) | Distribuido en branches |

---

*platform-docs/DELIVERY.md · v0.1 · Producto #001 · 2026-05-10*
